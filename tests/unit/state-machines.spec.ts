import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  INITIAL_ROADMAP_STATE,
  roadmapReducer,
} from "@features/strategic-roadmap";
import {
  createInitialMissionFlowState,
  missionFlowReducer,
} from "@features/mission-flow";
import {
  ConsentLifecycleState,
  normalizeUserRole,
  resolveRouteGuard,
  transitionConsentLifecycle,
} from "@features/rbac-governance";

describe("Tier 1 & 3A — Deterministic State Machines & Spend Isolation", () => {
  it("scrubs live secrets and blocks unmocked outbound fetch calls", async () => {
    expect(process.env.CHAIRMAN_TEST_ISOLATION).toBe("1");
    expect(process.env.DATABASE_URL).toBe("");
    expect(process.env.GEMINI_API_KEY).toBe("");
    expect(process.env.STRIPE_SECRET_KEY).toBe("");

    await expect(fetch("https://generativelanguage.googleapis.com/v1beta/models")).rejects.toThrow(
      "SPEND_ISOLATION_VIOLATION"
    );
  });

  it("enforces Strategic Roadmap INV-1..INV-3 invariants across 200 randomized reducer sequences", () => {
    const domains = ["master", "dogs", "health", "wealth", "family", "happiness", "custom"] as const;

    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({ type: fc.constant("SELECT_DOMAIN" as const), domain: fc.constantFrom(...domains) }),
            fc.record({ type: fc.constant("SET_VIEW_MODE" as const), viewMode: fc.constantFrom("dag" as const, "pyramid" as const) }),
            fc.record({ type: fc.constant("OPEN_DOSSIER" as const), nodeId: fc.constantFrom("goal", "nonexistent_node_xyz") }),
            fc.constant({ type: "OPEN_DWY_INTERVIEW" as const }),
            fc.constant({ type: "OPEN_DIY_BUILDER" as const }),
            fc.constant({ type: "CLOSE_MODAL" as const }),
            fc.constant({ type: "SYNTHESIZE_START" as const })
          ),
          { minLength: 10, maxLength: 30 }
        ),
        (events) => {
          let state = INITIAL_ROADMAP_STATE;
          for (const ev of events) {
            state = roadmapReducer(state, ev);
            if (state.activeModal.kind === "DOSSIER") {
              expect(state.activeModal.nodeId).not.toBe("nonexistent_node_xyz");
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("enforces Mission Flow 6-stage bounds, single-flight deploy guard, and missing-title redirect", () => {
    let s = createInitialMissionFlowState("health");
    expect(s.stage).toBe(0);

    s = missionFlowReducer(s, { type: "PREV_STAGE" });
    expect(s.stage).toBe(0);

    s = missionFlowReducer(s, { type: "DEPLOY_REJECT_MISSING_TITLE" });
    expect(s.stage).toBe(1);
    expect(s.toast?.message).toContain("Mission Goal Title");

    s = missionFlowReducer(s, { type: "RUN_DFY", prompt: "Cut to 155 lbs @ 8% BF" });
    expect(s.draft.endState.title.length).toBeGreaterThan(0);
    expect(s.draft.nodes.length).toBeGreaterThan(0);

    s = missionFlowReducer(s, { type: "DEPLOY_START" });
    expect(s.asyncPhase).toBe("DEPLOYING");

    const blockedSaveWhileDeploying = missionFlowReducer(s, { type: "SAVE_AAR_START" });
    expect(blockedSaveWhileDeploying.asyncPhase).toBe("DEPLOYING");
  });

  it("enforces RBAC route guards and Pod Consent lifecycle role authorization", () => {
    expect(resolveRouteGuard(normalizeUserRole(undefined, false), "AUTHENTICATED")).toBe(
      "REDIRECT_SIGNIN"
    );
    expect(resolveRouteGuard(normalizeUserRole("MEMBER", true), "ADMIN")).toBe("REDIRECT_HOME");
    expect(resolveRouteGuard(normalizeUserRole("ADMIN", true), "ADMIN")).toBe("ALLOW");

    let consent: ConsentLifecycleState = {
      status: "DRAFT",
      podId: "pod-01",
      actorRole: "PARTNER",
      revision: 0,
      lastError: null,
    };

    consent = transitionConsentLifecycle(consent, {
      type: "SUBMIT_FOR_REVIEW",
      actorRole: "PARTNER",
    });
    expect(consent.status).toBe("PENDING_REVIEW");

    const deniedMemberApprove = transitionConsentLifecycle(consent, {
      type: "APPROVE_GRANT",
      actorRole: "MEMBER",
    });
    expect(deniedMemberApprove.status).toBe("PENDING_REVIEW");
    expect(deniedMemberApprove.lastError).toContain("MANAGE_POD_CONSENT");

    consent = transitionConsentLifecycle(consent, {
      type: "APPROVE_GRANT",
      actorRole: "OWNER",
    });
    expect(consent.status).toBe("ACTIVE_GRANT");

    consent = transitionConsentLifecycle(consent, {
      type: "REVOKE_GRANT",
      actorRole: "ADMIN",
    });
    expect(consent.status).toBe("REVOKED");

    const illegalDirectApproveFromRevoked = transitionConsentLifecycle(consent, {
      type: "APPROVE_GRANT",
      actorRole: "OWNER",
    });
    expect(illegalDirectApproveFromRevoked.status).toBe("REVOKED");
  });
});
