from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from backend.schemas.pods import (
    HisAndHersDashboardResponseDTO,
    PodConsentUpdateDTO,
    PodRole,
    PodType,
    SharedMemberProfileDTO,
)
from backend.store import STORE

router = APIRouter(prefix="/api/v1/pods", tags=["Shared Pods"])


@router.get("/dashboard", response_model=HisAndHersDashboardResponseDTO)
async def get_pods_dashboard() -> HisAndHersDashboardResponseDTO:
    consent = STORE.active_pod_consent
    chairman_blocks = [
        {
            "id": ev.id,
            "title": ev.title if consent.share_calendar_details else "Busy Block",
            "domain": ev.domain.value,
            "start_time": ev.start_time.isoformat(),
            "end_time": ev.end_time.isoformat(),
            "sweep_angle": ev.sweep_angle,
        }
        for ev in STORE.circadian_events
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
            shared_calendar_blocks=chairman_blocks if consent.share_calendar_events else [],
            shared_nutrition_summary=(
                {"calories_remaining": 620, "protein_g": 168, "target_protein_g": 180}
                if consent.share_nutrition_macros
                else None
            ),
            shared_finance_summary=(
                {"household_runway_months": 24, "joint_savings_pct": 88}
                if consent.share_finances
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
        pod_id=consent.pod_id,
        pod_name="Sovereign Household Pod",
        pod_type=PodType.COUPLE,
        sync_score_pct=96,
        members=members,
        active_consent=consent,
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


@router.post("/consent", response_model=PodConsentUpdateDTO)
async def update_pod_consent(payload: PodConsentUpdateDTO) -> PodConsentUpdateDTO:
    STORE.active_pod_consent = payload.model_copy(
        update={"updated_at": datetime.now(timezone.utc)}
    )
    return STORE.active_pod_consent
