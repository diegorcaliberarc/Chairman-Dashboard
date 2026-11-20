from __future__ import annotations

import base64
import os
import socket
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.main import app
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
from backend.state_machines.pod_governance import (
    ConsentEventType,
    ConsentLifecycleStatus,
    ConsentTransitionError,
    PodConsentMachineState,
    transition_pod_consent,
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
    assert active_ev.sweep_angle == 30.0
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
    assert future_ev.sweep_angle == 22.5
    assert future_ev.is_active_now is False


def test_strict_extra_forbid_blocks_mass_assignment_injection() -> None:
    client = TestClient(app)
    injected_res = client.post(
        "/api/v1/pods/consent",
        json={
            "pod_id": "pod-01",
            "grantor_user_id": "user-a",
            "grantee_user_id": "user-b",
            "is_admin": True,
            "plaid_access_token": "leak-attempt",
        },
    )
    assert injected_res.status_code == 422


def test_zero_trust_cors_blocks_untrusted_origins_while_allowing_localhost() -> None:
    client = TestClient(app)
    evil_res = client.options(
        "/api/v1/pods/dashboard",
        headers={
            "Origin": "https://evil.attacker.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert evil_res.headers.get("access-control-allow-origin") is None

    trusted_res = client.options(
        "/api/v1/pods/dashboard",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert trusted_res.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_pod_governance_deterministic_state_machine() -> None:
    s0 = PodConsentMachineState(pod_id="pod-01")
    assert s0.status == ConsentLifecycleStatus.DRAFT

    with pytest.raises(ConsentTransitionError):
        transition_pod_consent(s0, ConsentEventType.SUBMIT_FOR_REVIEW, PodRole.DEPENDENT)

    s1 = transition_pod_consent(s0, ConsentEventType.SUBMIT_FOR_REVIEW, PodRole.PARTNER)
    assert s1.status == ConsentLifecycleStatus.PENDING_REVIEW

    with pytest.raises(ConsentTransitionError):
        transition_pod_consent(s1, ConsentEventType.APPROVE_GRANT, PodRole.MEMBER)

    s2 = transition_pod_consent(s1, ConsentEventType.APPROVE_GRANT, PodRole.OWNER)
    assert s2.status == ConsentLifecycleStatus.ACTIVE_GRANT

    s3 = transition_pod_consent(s2, ConsentEventType.REVOKE_GRANT, PodRole.ADMIN)
    assert s3.status == ConsentLifecycleStatus.REVOKED

    with pytest.raises(ConsentTransitionError):
        transition_pod_consent(s3, ConsentEventType.APPROVE_GRANT, PodRole.OWNER)

    s4 = transition_pod_consent(s3, ConsentEventType.REOPEN_DRAFT, PodRole.OWNER)
    assert s4.status == ConsentLifecycleStatus.DRAFT


def test_spend_and_secret_isolation_fixture_is_enforced() -> None:
    assert os.environ.get("CHAIRMAN_TEST_ISOLATION") == "1"
    assert os.environ.get("DATABASE_URL") == ""
    assert os.environ.get("GEMINI_API_KEY") == ""
    assert os.environ.get("STRIPE_SECRET_KEY") == ""

    with pytest.raises(RuntimeError, match="SPEND_ISOLATION_VIOLATION"):
        socket.create_connection(("generativelanguage.googleapis.com", 443), timeout=1)


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

    manifest_res = client.get("/mcp/manifest")
    assert manifest_res.status_code == 200
    manifest = manifest_res.json()
    assert manifest["server_name"] == "chairman-living-os-mcp"
    assert len(manifest["tools"]) >= 4

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

    pods_res = client.get("/api/v1/pods/dashboard")
    assert pods_res.status_code == 200
    assert pods_res.json()["pod_type"] == "couple"

    with client.websocket_connect("/ws/copilot/live") as ws:
        ready = ws.receive_json()
        assert ready["type"] == "session_ready"

        ws.send_bytes(b"\x00\x01" * 1600)
        pcm_ack = ws.receive_json()
        assert pcm_ack["type"] == "pcm_ack"
        assert pcm_ack["chunk_bytes"] == 3200

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
