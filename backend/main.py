from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from uuid import uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.schemas.circadian import (
        ChecklistItemDTO,
        CircadianEventCreateDTO,
        CircadianEventResponseDTO,
        EventDomain,
        MediaType,
    )
    from backend.schemas.pods import (
        HisAndHersDashboardResponseDTO,
        PodConsentUpdateDTO,
        PodRole,
        PodType,
        SharedMemberProfileDTO,
    )
except ImportError:  # pragma: no cover - direct execution from backend/ cwd
    from schemas.circadian import (  # type: ignore
        ChecklistItemDTO,
        CircadianEventCreateDTO,
        CircadianEventResponseDTO,
        EventDomain,
        MediaType,
    )
    from schemas.pods import (  # type: ignore
        HisAndHersDashboardResponseDTO,
        PodConsentUpdateDTO,
        PodRole,
        PodType,
        SharedMemberProfileDTO,
    )

app = FastAPI(
    title="Chairman Dashboard Living OS — Sovereign API",
    description=(
        "Section 5 & 13.5 FastAPI Contract Engine: Circadian Solar Arc, "
        "Zero-Trust Shared Pods, MCP Mesh Manifest, and Multimodal Live Copilot WebSocket."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_circadian_events() -> List[CircadianEventResponseDTO]:
    now = datetime.now(timezone.utc)
    day_anchor = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return [
        CircadianEventResponseDTO(
            id="seed-gym-0630",
            user_id="chairman-default",
            title="Garage Gym Compound Hypertrophy",
            description="Heavy barbell squat + weighted pull-ups + zone-2 finisher",
            domain=EventDomain.PHYSICAL_TRAINING,
            start_time=day_anchor + timedelta(hours=6, minutes=30),
            end_time=day_anchor + timedelta(hours=8, minutes=0),
            is_recurring=True,
            recurrence_rule="FREQ=DAILY",
            media_url="/circadian/gym-workout.jpg",
            media_type=MediaType.IMAGE,
            accent_color="#10b981",
            quadrant_slot=1,
            telemetry_source="garmin",
            checklists=[
                ChecklistItemDTO(label="Electrolyte + creatine pre-load", is_completed=True, sort_order=0),
                ChecklistItemDTO(label="Top set 4x6 Squat @ RPE 8.5", is_completed=False, sort_order=1),
            ],
        ),
        CircadianEventResponseDTO(
            id="seed-saas-0900",
            user_id="chairman-default",
            title="Deep Work — Living OS Architecture",
            description="Zero-distraction sovereign systems engineering block",
            domain=EventDomain.ENGINEERING,
            start_time=day_anchor + timedelta(hours=9, minutes=0),
            end_time=day_anchor + timedelta(hours=12, minutes=0),
            is_recurring=True,
            recurrence_rule="FREQ=DAILY",
            media_url="/circadian/saas-build.jpg",
            media_type=MediaType.IMAGE,
            accent_color="#2563eb",
            quadrant_slot=2,
            telemetry_source="clickup",
            checklists=[
                ChecklistItemDTO(label="Ship Circadian Radar Layer Engine", is_completed=True, sort_order=0),
                ChecklistItemDTO(label="Verify Pydantic v2 temporal validators", is_completed=True, sort_order=1),
            ],
        ),
        CircadianEventResponseDTO(
            id="seed-huskies-1730",
            user_id="chairman-default",
            title="Nova & Astro Sunset Pack Walk",
            description="2.5-mile twilight decompression trail walk",
            domain=EventDomain.FAMILY_PETS,
            start_time=day_anchor + timedelta(hours=17, minutes=30),
            end_time=day_anchor + timedelta(hours=18, minutes=30),
            is_recurring=True,
            recurrence_rule="FREQ=DAILY",
            media_url="/circadian/huskies-walk.jpg",
            media_type=MediaType.IMAGE,
            accent_color="#8b5cf6",
            quadrant_slot=4,
            telemetry_source="garmin",
            checklists=[
                ChecklistItemDTO(label="Harness & hydration pack check", is_completed=False, sort_order=0),
            ],
        ),
    ]


_CIRCADIAN_STORE: List[CircadianEventResponseDTO] = _seed_circadian_events()

_ACTIVE_POD_CONSENT = PodConsentUpdateDTO(
    pod_id="pod-sovereign-couple-01",
    grantor_user_id="chairman-default",
    grantee_user_id="partner-sovereign-01",
    share_finances=True,
    share_finance_transactions=False,
    share_pms_tasks=True,
    share_all_tasks=False,
    share_calendar_events=True,
    share_calendar_details=True,
    share_nutrition_macros=True,
    share_biometrics_workouts=True,
    share_biometrics_health_stats=False,
    share_trading_summary=False,
)


@app.get("/health")
async def healthcheck() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "chairman-living-os-fastapi",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get(
    "/api/v1/circadian/events",
    response_model=List[CircadianEventResponseDTO],
    tags=["Circadian Engine"],
)
async def list_circadian_events() -> List[CircadianEventResponseDTO]:
    return sorted(_CIRCADIAN_STORE, key=lambda ev: ev.start_time)


@app.post(
    "/api/v1/circadian/events",
    response_model=CircadianEventResponseDTO,
    status_code=status.HTTP_201_CREATED,
    tags=["Circadian Engine"],
)
async def create_circadian_event(
    payload: CircadianEventCreateDTO,
) -> CircadianEventResponseDTO:
    created = CircadianEventResponseDTO(
        id=str(uuid4()),
        user_id="chairman-default",
        **payload.model_dump(),
    )
    _CIRCADIAN_STORE.append(created)
    return created


@app.delete(
    "/api/v1/circadian/events/{event_id}",
    tags=["Circadian Engine"],
)
async def delete_circadian_event(event_id: str) -> Dict[str, Any]:
    global _CIRCADIAN_STORE
    before = len(_CIRCADIAN_STORE)
    _CIRCADIAN_STORE = [ev for ev in _CIRCADIAN_STORE if ev.id != event_id]
    if len(_CIRCADIAN_STORE) == before:
        raise HTTPException(status_code=404, detail="Circadian event not found")
    return {"ok": True, "deleted_id": event_id}


@app.get(
    "/api/v1/pods/dashboard",
    response_model=HisAndHersDashboardResponseDTO,
    tags=["Shared Pods"],
)
async def get_pods_dashboard() -> HisAndHersDashboardResponseDTO:
    chairman_blocks = [
        {
            "id": ev.id,
            "title": ev.title if _ACTIVE_POD_CONSENT.share_calendar_details else "Busy Block",
            "domain": ev.domain.value,
            "start_time": ev.start_time.isoformat(),
            "end_time": ev.end_time.isoformat(),
            "sweep_angle": ev.sweep_angle,
        }
        for ev in _CIRCADIAN_STORE
    ]

    members = [
        SharedMemberProfileDTO(
            user_id="chairman-default",
            role=PodRole.OWNER,
            display_alias="Diego (Chairman)",
            avatar_url="/icons/icon.svg",
            active_streak_days=28,
            today_completed_tasks_count=6,
            today_workout_completed=True,
            current_status="Solar Apex · Deep Engineering Sprint",
            shared_calendar_blocks=chairman_blocks if _ACTIVE_POD_CONSENT.share_calendar_events else [],
            shared_nutrition_summary=(
                {"calories_remaining": 620, "protein_g": 168, "target_protein_g": 180}
                if _ACTIVE_POD_CONSENT.share_nutrition_macros
                else None
            ),
            shared_finance_summary=(
                {"household_runway_months": 24, "joint_savings_pct": 88}
                if _ACTIVE_POD_CONSENT.share_finances
                else None
            ),
        ),
        SharedMemberProfileDTO(
            user_id="partner-sovereign-01",
            role=PodRole.PARTNER,
            display_alias="Partner (Co-Pilot)",
            avatar_url="/icons/icon.svg",
            active_streak_days=21,
            today_completed_tasks_count=5,
            today_workout_completed=True,
            current_status="Morning Pilates & Studio Operations",
            shared_calendar_blocks=[
                {
                    "id": "partner-pilates-0800",
                    "title": "Reformer Mobility & Core",
                    "domain": "physical_training",
                    "sweep_angle": 15.0,
                },
                {
                    "id": "partner-dinner-1900",
                    "title": "Cast-Iron Ribeye & Sunset Patio",
                    "domain": "nutrition",
                    "sweep_angle": 15.0,
                },
            ],
            shared_nutrition_summary={"hydration_pct": 92, "protein_goal_met": True},
        ),
    ]

    return HisAndHersDashboardResponseDTO(
        pod_id=_ACTIVE_POD_CONSENT.pod_id,
        pod_name="Sovereign Household Pod",
        pod_type=PodType.COUPLE,
        sync_score_pct=96,
        members=members,
        active_consent=_ACTIVE_POD_CONSENT,
        shared_upcoming_anchors=[
            {
                "title": "Nova & Astro Sunset Pack Walk",
                "time": "17:30",
                "domain": "family_pets",
            },
            {
                "title": "Cast-Iron Ribeye Refuel",
                "time": "19:00",
                "domain": "nutrition",
            },
        ],
    )


@app.post(
    "/api/v1/pods/consent",
    response_model=PodConsentUpdateDTO,
    tags=["Shared Pods"],
)
async def update_pod_consent(payload: PodConsentUpdateDTO) -> PodConsentUpdateDTO:
    global _ACTIVE_POD_CONSENT
    _ACTIVE_POD_CONSENT = payload.model_copy(
        update={"updated_at": datetime.now(timezone.utc)}
    )
    return _ACTIVE_POD_CONSENT


@app.get("/mcp/manifest", tags=["MCP Sovereign Mesh"])
async def get_mcp_manifest() -> Dict[str, Any]:
    return {
        "protocol_version": "2025-03-26",
        "server_name": "chairman-living-os-mcp",
        "server_version": "2.0.0",
        "transport": ["http-rest", "websocket-live"],
        "tools": [
            {
                "name": "circadian.schedule_block",
                "description": "Deploy or recalibrate a 24-hour polar circadian event block with strict temporal validation.",
                "input_schema": CircadianEventCreateDTO.model_json_schema(),
            },
            {
                "name": "circadian.toggle_radar_layer",
                "description": "Query or recalibrate 96-point 15-minute physiological radar curves (energy, activity, posture, metabolic).",
                "parameters": {
                    "layer_type": [
                        "energy_forecast",
                        "activity_density",
                        "posture_biometrics",
                        "metabolic_burn",
                    ],
                    "buckets": 96,
                },
            },
            {
                "name": "pods.update_zero_trust_consent",
                "description": "Atomically toggle granular His & Hers shared pod telemetry permissions.",
                "input_schema": PodConsentUpdateDTO.model_json_schema(),
            },
            {
                "name": "copilot.live_multimodal_stream",
                "description": "Full-duplex WebSocket PCM16 audio + 1fps JPEG/WebP vision frame stream at /ws/copilot/live.",
                "endpoint": "/ws/copilot/live",
            },
        ],
    }


@app.websocket("/ws/copilot/live")
async def copilot_live_websocket(websocket: WebSocket) -> None:
    """
    Full-duplex Multimodal Copilot WebSocket endpoint:
    - Accepts binary PCM16 audio frames (16kHz/24kHz mono)
    - Accepts JSON control, PCM base64 chunks (`type: "pcm_chunk"`),
      vision/screen frames (`type: "video_frame"`), and tool prompts (`type: "user_turn"`).
    """
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
                        {
                            "type": "error",
                            "detail": "Malformed JSON frame on /ws/copilot/live",
                        }
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
                            "active_events_count": len(_CIRCADIAN_STORE),
                        }
                    )
    except WebSocketDisconnect:
        return
