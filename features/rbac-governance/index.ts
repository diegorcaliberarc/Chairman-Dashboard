/**
 * Public Barrel — RBAC & Pod Consent Governance (`@features/rbac-governance`)
 */
export {
  hasCapability,
  normalizeUserRole,
  resolveRouteGuard,
  transitionConsentLifecycle,
} from "./state/rbacMachine";
export type {
  ConsentLifecycleEvent,
  ConsentLifecycleState,
  ConsentLifecycleStatus,
  RouteAccessRequirement,
  RouteGuardDecision,
  SystemCapability,
  SystemRole,
} from "./state/rbacMachine";
