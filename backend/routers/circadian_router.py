from __future__ import annotations

from typing import Any, Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from backend.schemas.circadian import (
    CircadianEventCreateDTO,
    CircadianEventResponseDTO,
)
from backend.store import STORE

router = APIRouter(prefix="/api/v1/circadian", tags=["Circadian Engine"])


@router.get("/events", response_model=List[CircadianEventResponseDTO])
async def list_circadian_events() -> List[CircadianEventResponseDTO]:
    return sorted(STORE.circadian_events, key=lambda ev: ev.start_time)


@router.post(
    "/events",
    response_model=CircadianEventResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_circadian_event(
    payload: CircadianEventCreateDTO,
) -> CircadianEventResponseDTO:
    created = CircadianEventResponseDTO(
        id=str(uuid4()),
        user_id="chairman-default",
        **payload.model_dump(),
    )
    STORE.circadian_events.append(created)
    return created


@router.delete("/events/{event_id}")
async def delete_circadian_event(event_id: str) -> Dict[str, Any]:
    before = len(STORE.circadian_events)
    STORE.circadian_events = [
        ev for ev in STORE.circadian_events if ev.id != event_id
    ]
    if len(STORE.circadian_events) == before:
        raise HTTPException(status_code=404, detail="Circadian event not found")
    return {"ok": True, "deleted_id": event_id}
