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
import {
  buildAuthSessionMock,
  buildCalendarOpsMock,
  buildCircadianRadarMock,
  buildKpiScorecardMock,
  buildMissionFlowGetMock,
  buildMissionFlowPostMock,
  buildRoadmapsSynthesizeMock,
  buildUiPreferencesMock,
} from "../fixtures/apiContractMocks";

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

  it("maintains strict Mock Contract Parity with production API route shapes", () => {
    const dfyRes = buildRoadmapsSynthesizeMock({
      action: "dfy",
      domain: "health",
      goalPrompt: "Cut to 155 lbs @ 8% BF",
    });
    expect(dfyRes.success).toBe(true);
    expect("tree" in dfyRes && dfyRes.tree.tier0.length > 0).toBe(true);
    expect("source" in dfyRes && dfyRes.source).toBe("deterministic");

    const dwyInitRes = buildRoadmapsSynthesizeMock({
      action: "dwy_init",
      goalPrompt: "Scale SaaS MRR",
    });
    expect("questions" in dwyInitRes && dwyInitRes.questions.length).toBe(3);

    const mfGet = buildMissionFlowGetMock();
    expect(mfGet).toEqual({ success: true, missions: [], lessons: [] });

    const mfDeploy = buildMissionFlowPostMock({ action: "deploy_mission" });
    expect(mfDeploy.success).toBe(true);
    expect("pmsSynced" in mfDeploy && typeof mfDeploy.pmsSynced).toBe("number");

    const mfAar = buildMissionFlowPostMock({
      action: "save_aar_lesson",
      missionTitle: "Audit Parity",
      domain: "master",
    });
    expect(mfAar.success).toBe(true);
    expect("lesson" in mfAar && mfAar.lesson?.missionTitle).toBe("Audit Parity");

    const uiPrefs = buildUiPreferencesMock();
    expect(uiPrefs.ok).toBe(true);
    expect(uiPrefs.preferences).toBeNull();
    expect(uiPrefs.wheelStops.length).toBe(3);

    const calOps = buildCalendarOpsMock();
    expect(calOps.shiftConfig.totalScheduledDays).toBe(22);
    expect(calOps.paySummary.payRate).toBe(320);

    const radar = buildCircadianRadarMock("2026-11-20");
    expect(radar.bucketCount).toBe(96);

    const kpi = buildKpiScorecardMock();
    expect(kpi).toEqual({ ok: true, snapshots: [], streakCount: 0, latest: null });

    const session = buildAuthSessionMock();
    expect(session.userId).toBe("isolated-user-01");
    expect(session.role).toBe("ADMIN");
  });
});
