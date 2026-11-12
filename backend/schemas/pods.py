from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PodType(str, Enum):
    COUPLE = "couple"
    FAMILY = "family"
    BUSINESS_TEAM = "business_team"


class PodRole(str, Enum):
    OWNER = "owner"
    PARTNER = "partner"
    ADMIN = "admin"
    MEMBER = "member"
    DEPENDENT = "dependent"


class PodConsentUpdateDTO(BaseModel):
    """
    Zero-Trust Granular Consent Matrix for His & Hers / Multi-Member Shared Pods (Section 13.5).
    """

    model_config = ConfigDict(populate_by_name=True)

    pod_id: str = Field(..., min_length=1)
    grantor_user_id: str = Field(default="chairman-default", min_length=1)
    grantee_user_id: str = Field(..., min_length=1)
    share_finances: bool = Field(default=False)
    share_finance_transactions: bool = Field(default=False)
    share_pms_tasks: bool = Field(default=False)
    share_all_tasks: bool = Field(default=False)
    share_calendar_events: bool = Field(default=True)
    share_calendar_details: bool = Field(default=False)
    share_nutrition_macros: bool = Field(default=False)
    share_biometrics_workouts: bool = Field(default=True)
    share_biometrics_health_stats: bool = Field(default=False)
    share_trading_summary: bool = Field(default=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SharedMemberProfileDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(..., min_length=1)
    role: PodRole = Field(default=PodRole.MEMBER)
    display_alias: str = Field(..., min_length=1, max_length=64)
    avatar_url: Optional[str] = Field(default=None)
    active_streak_days: int = Field(default=14, ge=0)
    today_completed_tasks_count: int = Field(default=0, ge=0)
    today_workout_completed: bool = Field(default=False)
    current_status: Optional[str] = Field(default=None, max_length=120)
    shared_calendar_blocks: List[Dict[str, Any]] = Field(default_factory=list)
    shared_nutrition_summary: Optional[Dict[str, Any]] = Field(default=None)
    shared_finance_summary: Optional[Dict[str, Any]] = Field(default=None)


class HisAndHersDashboardResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pod_id: str = Field(..., min_length=1)
    pod_name: str = Field(..., min_length=1, max_length=120)
    pod_type: PodType = Field(default=PodType.COUPLE)
    sync_score_pct: int = Field(default=94, ge=0, le=100)
    members: List[SharedMemberProfileDTO] = Field(default_factory=list)
    active_consent: PodConsentUpdateDTO
    shared_upcoming_anchors: List[Dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
