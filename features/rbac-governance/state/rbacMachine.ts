export type SystemRole =
  | "ADMIN"
  | "OWNER"
  | "PARTNER"
  | "MEMBER"
  | "DEPENDENT"
  | "ANONYMOUS";

export type SystemCapability =
  | "VIEW_ADMIN_VAULT"
  | "PROMOTE_USER_ROLE"
  | "MANAGE_POD_CONSENT"
  | "DEPLOY_STRATEGIC_MISSION"
  | "VIEW_SHARED_POD_TELEMETRY";

export type RouteAccessRequirement = "PUBLIC" | "AUTHENTICATED" | "ADMIN";
export type RouteGuardDecision = "ALLOW" | "REDIRECT_SIGNIN" | "REDIRECT_HOME";

export type ConsentLifecycleStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE_GRANT"
  | "RESTRICTED"
  | "REVOKED";

export interface ConsentLifecycleState {
  status: ConsentLifecycleStatus;
  podId: string;
  actorRole: SystemRole;
  revision: number;
  lastError: string | null;
}

export type ConsentLifecycleEvent =
  | { type: "SUBMIT_FOR_REVIEW"; actorRole: SystemRole }
  | { type: "APPROVE_GRANT"; actorRole: SystemRole }
  | { type: "RESTRICT_SCOPE"; actorRole: SystemRole }
  | { type: "REVOKE_GRANT"; actorRole: SystemRole }
  | { type: "REOPEN_DRAFT"; actorRole: SystemRole };

const ROLE_CAPABILITIES: Record<SystemRole, ReadonlySet<SystemCapability>> = {
  ADMIN: new Set<SystemCapability>([
    "VIEW_ADMIN_VAULT",
    "PROMOTE_USER_ROLE",
    "MANAGE_POD_CONSENT",
    "DEPLOY_STRATEGIC_MISSION",
    "VIEW_SHARED_POD_TELEMETRY",
  ]),
  OWNER: new Set<SystemCapability>([
    "MANAGE_POD_CONSENT",
    "DEPLOY_STRATEGIC_MISSION",
    "VIEW_SHARED_POD_TELEMETRY",
  ]),
  PARTNER: new Set<SystemCapability>([
    "DEPLOY_STRATEGIC_MISSION",
    "VIEW_SHARED_POD_TELEMETRY",
  ]),
  MEMBER: new Set<SystemCapability>(["VIEW_SHARED_POD_TELEMETRY"]),
  DEPENDENT: new Set<SystemCapability>(["VIEW_SHARED_POD_TELEMETRY"]),
  ANONYMOUS: new Set<SystemCapability>(),
};

export function normalizeUserRole(rawRole: unknown, hasSession = true): SystemRole {
  if (!hasSession) return "ANONYMOUS";
  if (typeof rawRole !== "string") return "MEMBER";
  const upper = rawRole.trim().toUpperCase();
  if (
    upper === "ADMIN" ||
    upper === "OWNER" ||
    upper === "PARTNER" ||
    upper === "MEMBER" ||
    upper === "DEPENDENT"
  ) {
    return upper;
  }
  return "MEMBER";
}

export function hasCapability(role: SystemRole, capability: SystemCapability): boolean {
  return ROLE_CAPABILITIES[role].has(capability);
}

export function resolveRouteGuard(
  role: SystemRole,
  requirement: RouteAccessRequirement
): RouteGuardDecision {
  if (requirement === "PUBLIC") return "ALLOW";
  if (role === "ANONYMOUS") return "REDIRECT_SIGNIN";
  if (requirement === "ADMIN" && !hasCapability(role, "VIEW_ADMIN_VAULT")) {
    return "REDIRECT_HOME";
  }
  return "ALLOW";
}

/**
 * Deterministic state machine governing multi-step Pod / RBAC consent grants:
 * - Only ADMIN or OWNER can APPROVE_GRANT or REVOKE_GRANT.
 * - REVOKED grants cannot jump directly to ACTIVE_GRANT; they must REOPEN_DRAFT first.
 */
export function transitionConsentLifecycle(
  state: ConsentLifecycleState,
  event: ConsentLifecycleEvent
): ConsentLifecycleState {
  const canGovern = hasCapability(event.actorRole, "MANAGE_POD_CONSENT");

  switch (event.type) {
    case "SUBMIT_FOR_REVIEW": {
      if (state.status !== "DRAFT") {
        return {
          ...state,
          lastError: `Cannot submit from ${state.status}; expected DRAFT.`,
        };
      }
      return {
        ...state,
        status: "PENDING_REVIEW",
        actorRole: event.actorRole,
        revision: state.revision + 1,
        lastError: null,
      };
    }
    case "APPROVE_GRANT": {
      if (!canGovern) {
        return {
          ...state,
          lastError: `Role ${event.actorRole} lacks MANAGE_POD_CONSENT capability.`,
        };
      }
      if (state.status !== "PENDING_REVIEW" && state.status !== "RESTRICTED") {
        return {
          ...state,
          lastError: `Cannot approve directly from ${state.status}.`,
        };
      }
      return {
        ...state,
        status: "ACTIVE_GRANT",
        actorRole: event.actorRole,
        revision: state.revision + 1,
        lastError: null,
      };
    }
    case "RESTRICT_SCOPE": {
      if (!canGovern) {
        return {
          ...state,
          lastError: `Role ${event.actorRole} lacks MANAGE_POD_CONSENT capability.`,
        };
      }
      if (state.status !== "ACTIVE_GRANT") {
        return {
          ...state,
          lastError: `Cannot restrict scope from ${state.status}; expected ACTIVE_GRANT.`,
        };
      }
      return {
        ...state,
        status: "RESTRICTED",
        actorRole: event.actorRole,
        revision: state.revision + 1,
        lastError: null,
      };
    }
    case "REVOKE_GRANT": {
      if (!canGovern) {
        return {
          ...state,
          lastError: `Role ${event.actorRole} lacks MANAGE_POD_CONSENT capability.`,
        };
      }
      if (state.status === "REVOKED") return state;
      return {
        ...state,
        status: "REVOKED",
        actorRole: event.actorRole,
        revision: state.revision + 1,
        lastError: null,
      };
    }
    case "REOPEN_DRAFT": {
      if (!canGovern) {
        return {
          ...state,
          lastError: `Role ${event.actorRole} lacks MANAGE_POD_CONSENT capability.`,
        };
      }
      if (state.status !== "REVOKED") {
        return {
          ...state,
          lastError: `Cannot reopen draft from ${state.status}; expected REVOKED.`,
        };
      }
      return {
        ...state,
        status: "DRAFT",
        actorRole: event.actorRole,
        revision: state.revision + 1,
        lastError: null,
      };
    }
    default:
      return state;
  }
}
