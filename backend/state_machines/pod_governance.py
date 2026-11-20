from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import FrozenSet

from backend.schemas.pods import PodRole


class ConsentLifecycleStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    ACTIVE_GRANT = "ACTIVE_GRANT"
    RESTRICTED = "RESTRICTED"
    REVOKED = "REVOKED"


class ConsentEventType(str, Enum):
    SUBMIT_FOR_REVIEW = "SUBMIT_FOR_REVIEW"
    APPROVE_GRANT = "APPROVE_GRANT"
    RESTRICT_SCOPE = "RESTRICT_SCOPE"
    REVOKE_GRANT = "REVOKE_GRANT"
    REOPEN_DRAFT = "REOPEN_DRAFT"


GOVERNANCE_ROLES: FrozenSet[PodRole] = frozenset({PodRole.OWNER, PodRole.ADMIN})


@dataclass(frozen=True)
class PodConsentMachineState:
    pod_id: str
    status: ConsentLifecycleStatus = ConsentLifecycleStatus.DRAFT
    revision: int = 0


class ConsentTransitionError(ValueError):
    """Raised when an invalid pod consent state transition or unauthorized role is attempted."""


def transition_pod_consent(
    state: PodConsentMachineState,
    event: ConsentEventType,
    actor_role: PodRole,
) -> PodConsentMachineState:
    """
    Deterministic finite-state machine for zero-trust Pod Consent transitions:
    - DRAFT -> PENDING_REVIEW (any authenticated pod member except DEPENDENT)
    - PENDING_REVIEW | RESTRICTED -> ACTIVE_GRANT (OWNER or ADMIN only)
    - ACTIVE_GRANT -> RESTRICTED (OWNER or ADMIN only)
    - Any non-REVOKED -> REVOKED (OWNER or ADMIN only)
    - REVOKED -> DRAFT via REOPEN_DRAFT (OWNER or ADMIN only; direct REVOKED -> ACTIVE_GRANT forbidden)
    """
    if event == ConsentEventType.SUBMIT_FOR_REVIEW:
        if actor_role == PodRole.DEPENDENT:
            raise ConsentTransitionError("Dependent role cannot submit consent grants.")
        if state.status != ConsentLifecycleStatus.DRAFT:
            raise ConsentTransitionError(
                f"SUBMIT_FOR_REVIEW requires DRAFT state, got {state.status.value}."
            )
        return PodConsentMachineState(
            pod_id=state.pod_id,
            status=ConsentLifecycleStatus.PENDING_REVIEW,
            revision=state.revision + 1,
        )

    if actor_role not in GOVERNANCE_ROLES:
        raise ConsentTransitionError(
            f"Role {actor_role.value} is not authorized to execute {event.value}."
        )

    if event == ConsentEventType.APPROVE_GRANT:
        if state.status not in {
            ConsentLifecycleStatus.PENDING_REVIEW,
            ConsentLifecycleStatus.RESTRICTED,
        }:
            raise ConsentTransitionError(
                f"Cannot APPROVE_GRANT directly from {state.status.value}."
            )
        return PodConsentMachineState(
            pod_id=state.pod_id,
            status=ConsentLifecycleStatus.ACTIVE_GRANT,
            revision=state.revision + 1,
        )

    if event == ConsentEventType.RESTRICT_SCOPE:
        if state.status != ConsentLifecycleStatus.ACTIVE_GRANT:
            raise ConsentTransitionError(
                f"RESTRICT_SCOPE requires ACTIVE_GRANT, got {state.status.value}."
            )
        return PodConsentMachineState(
            pod_id=state.pod_id,
            status=ConsentLifecycleStatus.RESTRICTED,
            revision=state.revision + 1,
        )

    if event == ConsentEventType.REVOKE_GRANT:
        if state.status == ConsentLifecycleStatus.REVOKED:
            return state
        return PodConsentMachineState(
            pod_id=state.pod_id,
            status=ConsentLifecycleStatus.REVOKED,
            revision=state.revision + 1,
        )

    if event == ConsentEventType.REOPEN_DRAFT:
        if state.status != ConsentLifecycleStatus.REVOKED:
            raise ConsentTransitionError(
                f"REOPEN_DRAFT requires REVOKED state, got {state.status.value}."
            )
        return PodConsentMachineState(
            pod_id=state.pod_id,
            status=ConsentLifecycleStatus.DRAFT,
            revision=state.revision + 1,
        )

    raise ConsentTransitionError(f"Unsupported event: {event}")
