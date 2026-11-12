from __future__ import annotations

import base64
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

# Ensure workspace root is importable regardless of pytest invocation directory
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app  # noqa: E402
from backend.schemas.circadian import (  # noqa: E402
    ChecklistItemDTO,
    CircadianEventCreateDTO,
    CircadianEventResponseDTO,
    EventDomain,
    MediaType,
)
from backend.schemas.pods import (  # noqa: E402
    HisAndHersDashboardResponseDTO,
    PodConsentUpdateDTO,
    PodRole,
    PodType,
    SharedMemberProfileDTO,
)


def test_circadian_rejects_end_time_equal_to_start_time() -> None:
    t0 = datetime(2026, 11, 12, 9, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        CircadianEventCreateDTO(
            title="Zero-Duration Invalid Block",
            domain=EventDomain.ENGINEERING,
            start_time=t0,
            end_time=t0,
            media_url="/circadian/saas-build.jpg",
        )
    assert "end_time must be strictly greater than start_time" in str(exc_info.value)


def test_circadian_rejects_end_time_before_start_time() -> None:
    t0 = datetime(2026, 11, 12, 14, 0, tzinfo=timezone.utc)
    t_earlier = datetime(2026, 11, 12, 12, 30, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        CircadianEventCreateDTO(
            title="Inverted Temporal Window",
            domain=EventDomain.PHYSICAL_TRAINING,
            start_time=t0,
            end_time=t_earlier,
            media_url="/circadian/gym-workout.jpg",
        )
    assert "end_time must be strictly greater than start_time" in str(exc_info.value)


def test_circadian_response_computes_sweep_angle_and_is_active_now() -> None:
    now = datetime.now(timezone.utc)
    active_ev = CircadianEventResponseDTO(
        id="ev-active-2h",
        title="Active 2-Hour Deep Work Block",
        domain=EventDomain.ENGINEERING,
        start_time=now - timedelta(hours=1),
        end_time=now + timedelta(hours=1),
        media_url="/circadian/saas-build.jpg",
        media_type=MediaType.IMAGE,
        checklists=[ChecklistItemDTO(label="Execute architecture spec", is_completed=True)],
    )
    assert active_ev.duration_minutes == 120.0
    assert active_ev.sweep_angle == 30.0  # (120 / 1440) * 360 == 30.0 deg
    assert active_ev.is_active_now is True

    future_ev = CircadianEventResponseDTO(
        id="ev-future-90m",
        title="Future 90-Min Gym Session",
        domain=EventDomain.PHYSICAL_TRAINING,
        start_time=now + timedelta(hours=3),
        end_time=now + timedelta(hours=4, minutes=30),
        media_url="/circadian/gym-workout.jpg",
    )
    assert future_ev.duration_minutes == 90.0
    assert future_ev.sweep_angle == 22.5  # (90 / 1440) * 360 == 22.5 deg
    assert future_ev.is_active_now is False


def test_pods_dtos_contract_serialization() -> None:
    consent = PodConsentUpdateDTO(
        pod_id="pod-01",
        grantor_user_id="user-a",
        grantee_user_id="user-b",
        share_calendar_events=True,
        share_nutrition_macros=True,
    )
    member = SharedMemberProfileDTO(
        user_id="user-a",
        role=PodRole.OWNER,
        display_alias="Diego",
        active_streak_days=30,
        today_completed_tasks_count=5,
        today_workout_completed=True,
    )
    dashboard = HisAndHersDashboardResponseDTO(
        pod_id="pod-01",
        pod_name="His & Hers Sovereign Pod",
        pod_type=PodType.COUPLE,
        sync_score_pct=97,
        members=[member],
        active_consent=consent,
    )
    dumped = dashboard.model_dump()
    assert dumped["pod_type"] == PodType.COUPLE
    assert dumped["members"][0]["display_alias"] == "Diego"
    assert dumped["active_consent"]["share_nutrition_macros"] is True


def test_fastapi_rest_and_live_websocket_contracts() -> None:
    client = TestClient(app)

    # 1. GET /mcp/manifest
    manifest_res = client.get("/mcp/manifest")
    assert manifest_res.status_code == 200
    manifest = manifest_res.json()
    assert manifest["server_name"] == "chairman-living-os-mcp"
    assert len(manifest["tools"]) >= 4

    # 2. POST /api/v1/circadian/events rejects end_time <= start_time with 422
    bad_res = client.post(
        "/api/v1/circadian/events",
        json={
            "title": "Bad Window",
            "domain": "engineering",
            "start_time": "2026-11-12T15:00:00Z",
            "end_time": "2026-11-12T14:00:00Z",
            "media_url": "/circadian/saas-build.jpg",
        },
    )
    assert bad_res.status_code == 422

    # 3. POST /api/v1/circadian/events accepts valid window & computes sweep_angle
    good_res = client.post(
        "/api/v1/circadian/events",
        json={
            "title": "Evening Ribeye Protocol",
            "domain": "nutrition",
            "start_time": "2026-11-12T19:00:00Z",
            "end_time": "2026-11-12T20:00:00Z",
            "media_url": "/circadian/nutrition-steak.jpg",
            "accent_color": "#ea580c",
        },
    )
    assert good_res.status_code == 201
    created = good_res.json()
    assert created["sweep_angle"] == 15.0

    # 4. GET /api/v1/pods/dashboard
    pods_res = client.get("/api/v1/pods/dashboard")
    assert pods_res.status_code == 200
    assert pods_res.json()["pod_type"] == "couple"

    # 5. Full-duplex WebSocket /ws/copilot/live (PCM binary + video frame + turn)
    with client.websocket_connect("/ws/copilot/live") as ws:
        ready = ws.receive_json()
        assert ready["type"] == "session_ready"

        # Send binary PCM16 chunk (3200 bytes = 100ms @ 16kHz 16-bit mono)
        ws.send_bytes(b"\x00\x01" * 1600)
        pcm_ack = ws.receive_json()
        assert pcm_ack["type"] == "pcm_ack"
        assert pcm_ack["chunk_bytes"] == 3200

        # Send base64 vision frame
        ws.send_json(
            {
                "type": "video_frame",
                "mime_type": "image/jpeg",
                "data": base64.b64encode(b"fake-jpeg-bytes").decode("ascii"),
            }
        )
        frame_ack = ws.receive_json()
        assert frame_ack["type"] == "frame_ack"
        assert frame_ack["frame_index"] == 1


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
