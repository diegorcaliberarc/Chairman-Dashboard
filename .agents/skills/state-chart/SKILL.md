---
name: state-chart
description: >-
  Visual intent-verification skill using Mermaid stateDiagram-v2 state charts. Activate whenever
  creating or modifying multi-state UI views, drawers, modals, RBAC/consent lifecycles, or async
  workflows (specifically /roadmaps, /calendar Circadian Solar Wheel, /pms, /kpis,
  MissionFlowNavigatorModal, and Pod Governance) to produce before/after state charts, explicit
  transition triggers, and forbidden-state invariants inside walkthrough.md.
---

# State-Chart — Visual Intent & Deterministic State-Machine Skill (v3.0)

Close the intent-verification gap on complex multi-state UI surfaces and backend lifecycles so human reviewers and autonomous agents verify explicit state transitions and invariants visually rather than auditing raw diffs.

## When to Activate
Activate this skill whenever creating or modifying:
- Multi-view workspaces (`/roadmaps` DAG vs. Execution Pyramid, `/calendar` Circadian Solar Arc vs. Google Grid, `/pms` Kanban/List/Overview/Home, `/kpis` Matrix/Cards/Split).
- Multi-stage modals and drawers (`MissionFlowNavigatorModal` 6-stage engine, `TacticalDossierModal` / `pardo-fmea-dossier-drawer`, `DoneWithYouModal`, `ManualNodeBuilderModal`, `SundayReviewWizardModal`).
- Multi-step business/RBAC lifecycles (`@features/rbac-governance` consent/role transitions, FastAPI `backend/state_machines/pod_governance.py`).

## Architectural Coupling Rule (Tier 1 → Tier 3B)
1. **Explicit State Machines Over Boolean Soup:** Model 3+ coupled states as a pure TypeScript `useReducer` (`features/<slug>/state/`) or Python finite-state machine (`backend/state_machines/`) so illegal combinations are unrepresentable.
2. **Single-Flight Async Guards:** Async transitions (`SYNTHESIZING_DAG`, `DEPLOYING`, `SAVING_AAR`) MUST reject duplicate dispatches while in-flight.

## Required Deliverables in `walkthrough.md`
Embed **Before** and **After** Mermaid `stateDiagram-v2` charts plus an **Enforced Invariants & Forbidden States Table**:
1. **Valid States:** Uppercase state identifiers (`STAGE_0_OOCEMR`..`STAGE_5_HUD_AAR`, `DAG_VIEW`, `PYRAMID_VIEW`, `DRAWER_INSPECTING`, `DRAFT`, `PENDING_REVIEW`, `ACTIVE_GRANT`, `REVOKED`).
2. **Allowed Triggers:** Exact `[data-testid="..."]` events, role guards (`OWNER` / `ADMIN`), or API resolution/rejection events.
3. **Forbidden States & Invariants Table:** Document each `INV-*` invariant, the prevented hazard, and the reducer/property-test enforcement mechanism.

Reference canonical templates in [state-chart-patterns.md](./references/state-chart-patterns.md).
