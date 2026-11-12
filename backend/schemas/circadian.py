from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator


class EventDomain(str, Enum):
    ENGINEERING = "engineering"
    PHYSICAL_TRAINING = "physical_training"
    NUTRITION = "nutrition"
    FAMILY_PETS = "family_pets"
    LOGISTICS = "logistics"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO_LOOP = "video_loop"


class ChecklistItemDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default_factory=lambda: str(uuid4()))
    label: str = Field(..., min_length=1, max_length=255)
    is_completed: bool = Field(default=False)
    sort_order: int = Field(default=0, ge=0)


class CircadianEventCreateDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    domain: EventDomain = Field(default=EventDomain.ENGINEERING)
    start_time: datetime
    end_time: datetime
    is_recurring: bool = Field(default=False)
    recurrence_rule: Optional[str] = Field(default=None, max_length=255)
    media_url: str = Field(default="/circadian/saas-build.jpg", min_length=1)
    media_type: MediaType = Field(default=MediaType.IMAGE)
    media_aspect_ratio: str = Field(default="16:9")
    accent_color: str = Field(
        default="#2563eb",
        pattern=r"^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$",
    )
    quadrant_slot: Optional[int] = Field(default=None, ge=1, le=4)
    linked_task_id: Optional[str] = Field(default=None)
    telemetry_source: Optional[str] = Field(default=None, max_length=64)
    checklists: List[ChecklistItemDTO] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_temporal_window(self) -> "CircadianEventCreateDTO":
        if self.end_time <= self.start_time:
            raise ValueError(
                "Invalid circadian temporal bounds: end_time must be strictly greater than start_time."
            )
        total_seconds = (self.end_time - self.start_time).total_seconds()
        if total_seconds > 86400:
            raise ValueError(
                "Circadian event block cannot exceed a 24-hour (86,400 second) solar cycle."
            )
        return self


class CircadianEventResponseDTO(CircadianEventCreateDTO):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: Optional[str] = Field(default="chairman-default")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def duration_minutes(self) -> float:
        return round((self.end_time - self.start_time).total_seconds() / 60.0, 2)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sweep_angle(self) -> float:
        """
        Section 2.2 Segment Sweep Angle Formula:
        DeltaTheta = (DurationMinutes / 1440) * 360.0
        """
        duration_mins = (self.end_time - self.start_time).total_seconds() / 60.0
        return round((duration_mins / 1440.0) * 360.0, 4)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_active_now(self) -> bool:
        if self.start_time.tzinfo is not None:
            now = datetime.now(timezone.utc)
            start_cmp = self.start_time.astimezone(timezone.utc)
            end_cmp = self.end_time.astimezone(timezone.utc)
        else:
            now = datetime.now()
            start_cmp = self.start_time
            end_cmp = self.end_time
        return start_cmp <= now <= end_cmp
