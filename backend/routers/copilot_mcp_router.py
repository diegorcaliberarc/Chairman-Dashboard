from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.schemas.circadian import CircadianEventCreateDTO
from backend.schemas.pods import PodConsentUpdateDTO
from backend.store import STORE

router = APIRouter(tags=["MCP Sovereign Mesh"])


@router.get("/mcp/manifest")
async def get_mcp_manifest() -> Dict[str, Any]:
    return {
        "protocol_version": "2025-03-26",
        "server_name": "chairman-living-os-mcp",
        "server_version": "3.0.0",
        "transport": ["streamable-http", "websocket-live"],
        "tools": [
            {
                "name": "circadian.schedule_block",
                "description": "Deploy or recalibrate a 24-hour polar circadian event block with strict temporal validation.",
                "read_only": False,
                "input_schema": CircadianEventCreateDTO.model_json_schema(),
            },
            {
                "name": "circadian.toggle_radar_layer",
                "description": "Query or recalibrate 96-point 15-minute physiological radar curves (energy, activity, posture, metabolic).",
                "read_only": True,
                "input_schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["layer_type"],
                    "properties": {
                        "layer_type": {
                            "type": "string",
                            "enum": [
                                "energy_forecast",
                                "activity_density",
                                "posture_biometrics",
                                "metabolic_burn",
                            ],
                        },
                        "buckets": {"type": "integer", "const": 96},
                    },
                },
            },
            {
                "name": "pods.update_zero_trust_consent",
                "description": "Atomically toggle granular His & Hers shared pod telemetry permissions.",
                "read_only": False,
                "input_schema": PodConsentUpdateDTO.model_json_schema(),
            },
            {
                "name": "copilot.live_multimodal_stream",
                "description": "Full-duplex WebSocket PCM16 audio + 1fps JPEG/WebP vision frame stream at /ws/copilot/live.",
                "read_only": False,
                "endpoint": "/ws/copilot/live",
                "input_schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["pcm_chunk", "video_frame", "ping", "user_turn"],
                        },
                        "content": {"type": "string", "maxLength": 4000},
                    },
                },
            },
        ],
    }


@router.websocket("/ws/copilot/live")
async def copilot_live_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    session_id = f"live-{uuid4().hex[:10]}"
    pcm_bytes_ingested = 0
    frames_ingested = 0

    await websocket.send_json(
        {
            "type": "session_ready",
            "session_id": session_id,
            "modalities": ["pcm16_audio", "vision_frame", "text", "mcp_tools"],
            "sample_rate_hz": 16000,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"] is not None:
                raw_pcm: bytes = message["bytes"]
                pcm_bytes_ingested += len(raw_pcm)
                duration_ms = round((len(raw_pcm) / 2 / 16000) * 1000, 2)
                await websocket.send_json(
                    {
                        "type": "pcm_ack",
                        "session_id": session_id,
                        "chunk_bytes": len(raw_pcm),
                        "total_pcm_bytes": pcm_bytes_ingested,
                        "estimated_ms": duration_ms,
                    }
                )
                continue

            if "text" in message and message["text"] is not None:
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    await websocket.send_json(
                        {"type": "error", "detail": "Malformed JSON frame on /ws/copilot/live"}
                    )
                    continue

                msg_type = payload.get("type", "user_turn")
                if msg_type == "pcm_chunk":
                    b64_data = payload.get("data", "")
                    decoded = base64.b64decode(b64_data) if b64_data else b""
                    pcm_bytes_ingested += len(decoded)
                    await websocket.send_json(
                        {
                            "type": "pcm_ack",
                            "session_id": session_id,
                            "chunk_bytes": len(decoded),
                            "total_pcm_bytes": pcm_bytes_ingested,
                        }
                    )
                elif msg_type == "video_frame":
                    frames_ingested += 1
                    mime_type = payload.get("mime_type", "image/jpeg")
                    frame_b64 = payload.get("data", "")
                    await websocket.send_json(
                        {
                            "type": "frame_ack",
                            "session_id": session_id,
                            "frame_index": frames_ingested,
                            "mime_type": mime_type,
                            "byte_estimate": int(len(frame_b64) * 0.75),
                        }
                    )
                elif msg_type == "ping":
                    await websocket.send_json(
                        {
                            "type": "pong",
                            "session_id": session_id,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                else:
                    prompt_text = payload.get("content") or payload.get("text") or ""
                    await websocket.send_json(
                        {
                            "type": "copilot_response",
                            "session_id": session_id,
                            "transcript": (
                                f"Commander telemetry locked. Processed '{prompt_text[:80]}' "
                                f"with {pcm_bytes_ingested} PCM bytes & {frames_ingested} visual frames in context."
                            ),
                            "active_events_count": len(STORE.circadian_events),
                        }
                    )
    except WebSocketDisconnect:
        return
