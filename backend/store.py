from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from backend.schemas.circadian import (
    ChecklistItemDTO,
    CircadianEventResponseDTO,
    EventDomain,
    MediaType,
)
from backend.schemas.pods import PodConsentUpdateDTO


def build_default_circadian_events() -> List[CircadianEventResponseDTO]:
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


def build_default_pod_consent() -> PodConsentUpdateDTO:
    return PodConsentUpdateDTO(
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


class InMemoryContractStore:
    def __init__(self) -> None:
        self.circadian_events: List[CircadianEventResponseDTO] = build_default_circadian_events()
        self.active_pod_consent: PodConsentUpdateDTO = build_default_pod_consent()

    def reset(self) -> None:
        self.circadian_events = build_default_circadian_events()
        self.active_pod_consent = build_default_pod_consent()


STORE = InMemoryContractStore()
