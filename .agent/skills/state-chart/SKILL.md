---
name: state-chart
description: >-
  Visual intent-verification skill using Mermaid stateDiagram-v2 state charts. Activate whenever
  creating or modifying multi-state UI views, drawers, modals, or async workflows (specifically
  /roadmaps, /calendar Circadian Solar Wheel, /pms, and MissionFlowNavigatorModal) to produce
  before/after state charts, explicit transition triggers, and forbidden-state invariants inside
  walkthrough.md.
---

# State-Chart — Visual Intent & State-Machine Verification Skill

Close the intent-verification gap on complex multi-state UI surfaces so human reviewers and autonomous agents verify explicit state transitions and invariants visually rather than auditing raw `useState` diffs.

## When to Activate
Activate this skill whenever creating or modifying:
- Multi-view workspaces (`/roadmaps` DAG vs. Execution Pyramid, `/calendar` Circadian Solar Arc vs. Google Grid, `/pms` Kanban/List/Gantt/Calendar/Home, `/kpis` Matrix/Cards/Split).
- Interactive drawers and multi-step modals (`TacticalDossierModal` / `pardo-fmea-dossier-drawer`, `DoneWithYouModal`, `ManualNodeBuilderModal`, `MissionFlowNavigatorModal`, `SundayReviewWizardModal`).
- Async synthesis or sync workflows (`SYNTHESIZING_DAG`, `/api/roadmaps/synthesize`, `/api/calendar/google-sync`).

## Architectural Coupling Rule (Tier 1 → Tier 3)
1. **Replace Boolean Soup with Explicit Reducers:** Whenever touching a multi-state surface with 3+ coupled `useState` flags, model the state machine via a typed `useReducer` hook inside `features/<slug>/hooks/` so impossible state combinations are unrepresentable in TypeScript.
2. **Enforce Single-Flight Async Guards:** Async transitions (e.g., `SYNTHESIZING_DAG`) MUST ignore duplicate dispatch triggers while in-flight.

## Required Deliverables in `walkthrough.md`
Whenever this skill applies, embed **both** a **Before** and **After** Mermaid `stateDiagram-v2` diagram in `walkthrough.md` alongside a concise **Invariants & Forbidden States Table**.

### 1. Mandatory Diagram Elements
Every `stateDiagram-v2` block MUST document:
- **Every Valid User-Facing State:** Explicit uppercase state identifiers (e.g., `DAG_VIEW`, `PYRAMID_VIEW`, `BACKWARD_CHAIN_OPEN`, `DRAWER_INSPECTING`, `DWY_INTERVIEW_OPEN`, `DIY_BUILDER_OPEN`, `SYNTHESIZING_DAG`, `ERROR_RECOVERY`).
- **Every Allowed Transition Trigger:** Exact `[data-testid="..."]` click/submit events, Co-Pilot mode switches (`DFY` | `DWY` | `DIY`), custom DOM events (`chairman:mission-deployed`), or `/api/*` resolution/rejection transitions.
- **Orthogonal / Nested Regions (Where Applicable):** Show how overlay states (`DRAWER_INSPECTING`, `BACKWARD_CHAIN_OPEN`) compose with or reset across primary view/domain changes.

### 2. Mandatory Forbidden-State & Invariant Table
Immediately below the Mermaid diagram, include a table of explicit invariants verified by the reducer and `npm run test:properties`:

| Invariant ID | Forbidden State / Hazard | Deterministic Enforcement Mechanism |
| :--- | :--- | :--- |
| `INV-1` | `DRAWER_INSPECTING` orphaned on nonexistent node after domain switch or tree replacement | Reducer re-validates `selectedNodeId` against active tree nodes on `SELECT_DOMAIN` / `SYNTHESIZE_SUCCESS`; resets to `null` if absent while preserving valid node across `DAG_VIEW` ↔ `PYRAMID_VIEW`. |
| `INV-2` | Double-firing `/api/roadmaps/synthesize` while `SYNTHESIZING_DAG` is already in-flight | Reducer guards `SYNTHESIZE_START` when `asyncPhase === "SYNTHESIZING_DAG"` and UI disables `[data-testid="roadmap-synthesize-dag-btn"]` + `[data-testid="copilot-generate-dag-btn"]`. |
| `INV-3` | Overlapping modals (`DRAWER_INSPECTING` + `DWY_INTERVIEW_OPEN` + `DIY_BUILDER_OPEN`) | Single discriminated union `activeModal: { kind: "NONE" } \| { kind: "DOSSIER"; nodeId: string } \| { kind: "DWY_INTERVIEW" } \| { kind: "DIY_BUILDER" }` makes simultaneous modals impossible. |

## Mermaid Syntax Guardrails
- Use `stateDiagram-v2` exclusively for state charts.
- Quote transition labels or state descriptions containing special characters (`:`, `/`, `(`, `)`, `[`, `]`) or keep transition labels clean alphanumeric + `[data-testid]` tokens without raw HTML tags.
- Reference canonical templates in [state-chart-patterns.md](./references/state-chart-patterns.md) for `/roadmaps`, `/calendar`, `/pms`, and `MissionFlowNavigatorModal`.
