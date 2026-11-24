# Chairman Dashboard — Agent Navigation, Route & UI Selector Map

> **MANDATORY AGENT MAINTENANCE RULE**
> Every Antigravity agent working in this repository MUST read this file before modifying any route, view switcher, modal, drawer, or navigation control—and MUST update `docs/FEATURE_MAP.md` in the same commit whenever:
> 1. A Next.js route (`app/**/page.tsx`) or API route (`app/api/**/route.ts`) is added, renamed, or removed.
> 2. A view toggle, modal, drawer, or primary interactive control is added or modified.
> 3. Any `data-testid` selector or ARIA dialog role changes.
>
> **Never rely on fragile CSS class selectors** when driving the Browser Subagent (`.agents/skills/verify-ui/SKILL.md`). Always target `[data-testid="..."]` or semantic ARIA roles documented below.

---

## 1. Global Layout Shell, Sidebar Navigation & Universal Modals

| Surface | Entry / Component Path | Backing Services / APIs | Deterministic `data-testid` & ARIA Selectors |
| :--- | :--- | :--- | :--- |
| **Executive Module Shell** | `components/chairman/ExecutiveModuleShell.tsx`<br/> Barrel: `shared/index.ts` | NextAuth session (`useSession`) | `[data-testid="module-shell-{moduleId}"]`<br/>`[data-testid="global-launch-mission-flow-btn"]` |
| **Dual-Column Sticky Sidebar** | `components/Sidebar.tsx`<br/>`components/AppearanceSettings.tsx`<br/>`components/UserAccountModal.tsx` | `/api/ui-preferences`<br/>`/api/calendar/google-sync` | **Home Emblem:** `[data-testid="nav-home-emblem"]`<br/>**Spheres:** `[data-testid="nav-sphere-all"]`, `nav-sphere-operations`, `nav-sphere-health`, `nav-sphere-wealth`, `nav-sphere-fam`, `nav-sphere-happiness`<br/>**Modules:** `[data-testid="nav-module-{ID}"]` (`MASTER`, `COMMAND`, `PMS`, `ROADMAPS`, `ORG_CHART`, `HORIZON`, `LIFE_OPS`, `SKILLS`, `ARTIFACTS`, `WORKOUTS`, `MACRO_OPS`, `CALENDAR_HABITS`, `MINDSET`, `BUDGET`, `CALIBER_ARC`, `MARKETING_AGENT`, `EDUCATION`, `PODS`, `FAMILY_HUB`)<br/>**Avatar & Settings:** `[data-testid="nav-avatar-menu-trigger"]`, `[data-testid="nav-settings-popover"]`, `[data-testid="nav-settings-link-codebase-diagrams"]`, `nav-settings-link-epistemic`, `nav-settings-link-integrations`, `nav-settings-link-resources`, `nav-settings-link-vault`<br/>**Theme Studio (Sole Theme Switcher):** `[data-testid="nav-theme-palette-trigger"]` |
| **Guided Mission Flow Navigator (6-Stage State Machine)** | `components/mission/MissionFlowNavigatorModal.tsx`<br/>`features/mission-flow/` (`state/missionFlowMachine.ts`, `hooks/useMissionFlowMachine.ts`, `Stage0OocemrPanel`..`Stage5HudAarPanel`)<br/>`services/missionFlowClientService.ts` | `GET/POST /api/mission-flow`<br/>Cross-syncs to `pms_tasks` & `yearly_appointments`<br/>Property Spec: `tests/properties/ui-invariants.spec.ts` (Property 4) | **Dialog:** `[data-testid="mission-flow-modal"]` (`data-active-stage`, `data-async-phase`, `role="dialog"`), `[data-testid="mission-close-btn"]`, `[data-testid="mission-flow-toast"]`<br/>**Co-Pilot Modes:** `[data-testid="mission-mode-dfy"]`, `mission-mode-dwy`, `mission-mode-diy`<br/>**DFY / DWY Controls:** `[data-testid="mission-dfy-input"]`, `[data-testid="mission-dfy-run-btn"]`, `[data-testid="mission-dwy-constraint-input"]`, `[data-testid="mission-dwy-tools-input"]`, `[data-testid="mission-dwy-calibrate-btn"]`<br/>**6-Stage Stepper & Panels:** `[data-testid="mission-stage-tab-0..5"]`, `[data-testid="mission-stage-panel-0..5"]`, `[data-testid="mission-prev-stage-btn"]`, `[data-testid="mission-next-stage-btn"]`, `[data-testid="mission-skip-stage0-btn"]`, `[data-testid="mission-goal-title-input"]`, `[data-testid="mission-add-wbs-node-btn"]`, `[data-testid="mission-deploy-btn"]`, `[data-testid="mission-aar-form"]`, `[data-testid="mission-save-aar-btn"]` |
| **Theme-Adaptive Pixel Companion** | `components/chairman/pixel-pals/DittoGengarPals.tsx`<br/>`components/GlassThemeController.tsx` | `lib/glassTheme.ts`, `lib/fontTheme.ts` | Ambient companion mounted globally in `app/layout.tsx` |

---

## 2. Operations & Planning Routes (`operations` Sphere)

### 2.1 `/` — Home Dashboard
- **Entry Point:** `app/page.tsx`
- **APIs & Persistence:** `/api/widgets`, `/api/ui-preferences`, `localStorage` widget layout state
- **Key Interactive Controls:** Customizable drag-and-drop widget grid, sphere quick-launchers, `[data-testid="module-shell-MASTER"]`.

### 2.2 `/command` — Operations & Strategy (Command Center)
- **Entry Point:** `app/command/page.tsx`
- **Feature Barrel & Services:** `features/strategy/index.ts` → `StrategyAiCommandBar.tsx` (top-anchored AI state-mutation chat), `TelemetryDriftBoxes.tsx` (compact Caloric Deficit Drift + NEAT Slippage boxes), `UnifiedDomainScorecardGrid.tsx`, `ExecutiveScorecardBox.tsx`, `CompactStrategyChart.tsx`, `StrategySilhouetteRegistry.tsx` · `services/strategyClientService.ts`
- **Legacy Subcomponents:** `components/command/NorthStarAnchorCard.tsx`, `WeeklyFragoPaceEditor.tsx`, `PhasesTransitionSequence.tsx`, `AarLessonVault.tsx`, `SundayReviewWizardModal.tsx`
- **APIs & Types:** `GET/POST /api/command`, `POST /api/command/chat`, `GET /api/scorecard`, `lib/commandTypes.ts` · Property Spec: `tests/properties/strategy-command.spec.ts`
- **Key Selectors:** `[data-testid="module-shell-COMMAND"]`, `[data-testid="strategy-command-root"]`, `[data-testid="strategy-ai-chat-widget"]`, `[data-testid="strategy-ai-chat-input"]`, `[data-testid="strategy-ai-chat-submit"]`, `[data-testid="strategy-ai-chat-receipt"]`, `[data-testid="strategy-telemetry-alerts-grid"]`, `[data-testid="strategy-card-caloric-drift"]`, `[data-testid="strategy-card-neat-slippage"]`, `[data-testid="strategy-domain-grid"]`, `[data-testid="strategy-domain-card-{health|wealth|relationships|happiness}"]`, `[data-testid="strategy-silhouette-{caloric|neat|health|wealth|relationships|happiness}"]`, `[data-testid="global-launch-mission-flow-btn"]`.

### 2.3 `/pms` — Project Management (Pristine PMS — ClickUp / Plane-Inspired)
- **Entry Point:** `app/pms/page.tsx`
- **Feature Barrel, State Machine & Components:** `features/pms/index.ts` → `features/pms/state/pmsMachine.ts` (`INV-PMS-1..4` non-orphaned drawer, mutually exclusive modal/drawer, atomic status badge sync), `features/pms/hooks/usePmsWorkspace.ts`, `TaskViewSwitcher.tsx`, `GroupedTaskList.tsx` (collapsible status groups, DnD, bottom quick-add), `TaskKanbanBoard.tsx` (DnD + collapsible columns), `TaskCalendarView.tsx` (due-date grid + DnD reschedule), `TaskDetailDrawer.tsx` (`side-peek` / `modal` / `full-screen` inspector with Markdown Edit/Preview, subtasks, checklists, comments), `PmsOverviewAndHome.tsx`, `PmsAiCommandBar.tsx`, `components/pms/PmsHierarchySidebar.tsx`, `components/pms/NewSpaceModal.tsx`
- **Services, Types & APIs:** `services/pmsClientService.ts`, `lib/pmsTypes.ts`, `GET/POST/PATCH/DELETE /api/pms`, cross-syncs AI commands to `/api/sitrep` & `/api/parse-food` · Property Spec: `tests/properties/ui-invariants.spec.ts` (Property 5)
- **Deterministic Selectors:**
  - Shell & Root: `[data-testid="module-shell-PMS"]`, `[data-testid="pms-workspace-root"]` (`data-view-mode`), `[data-testid="pms-toast"]`
  - Universal AI Command Input: `[data-testid="pms-ai-command-input"]`
  - View Switcher & Toolbar: `[data-testid="pms-view-switcher"]`, `[data-testid="pms-toggle-spaces-btn"]`, `[data-testid="pms-view-home"]`, `[data-testid="pms-view-overview"]`, `[data-testid="pms-view-list"]`, `[data-testid="pms-view-board"]`, `[data-testid="pms-view-calendar"]`, `[data-testid="pms-search-input"]`, `[data-testid="pms-priority-filter"]`, `[data-testid="pms-add-task-btn"]`
  - Grouped List View: `[data-testid="pms-grouped-list-view"]`, `[data-testid="pms-list-group-{statusId}"]`, `[data-testid="pms-list-group-toggle-{statusId}"]`, `[data-testid="pms-list-quickadd-btn-{statusId}"]`, `[data-testid="pms-list-quickadd-input-{statusId}"]`, `[data-testid="pms-list-task-{taskId}"]`
  - Kanban Board View: `[data-testid="pms-kanban-board-view"]`, `[data-testid="pms-kanban-col-{statusId}"]`, `[data-testid="pms-kanban-collapse-{statusId}"]`, `[data-testid="pms-kanban-card-{taskId}"]`
  - Task Calendar View: `[data-testid="pms-calendar-view"]`, `[data-testid="pms-cal-prev-month"]`, `[data-testid="pms-cal-next-month"]`, `[data-testid="pms-cal-day-{YYYY-MM-DD}"]`
  - Slide-Over Task Detail Drawer: `[data-testid="pms-task-drawer"]` (`role="dialog"`, `data-peek-mode`), `[data-testid="pms-drawer-peek-side"]`, `[data-testid="pms-drawer-peek-modal"]`, `[data-testid="pms-drawer-peek-full"]`, `[data-testid="pms-drawer-title-input"]`, `[data-testid="pms-drawer-status-select"]`, `[data-testid="pms-drawer-priority-select"]`, `[data-testid="pms-drawer-due-input"]`, `[data-testid="pms-drawer-desc-input"]`, `[data-testid="pms-drawer-subtask-input"]`, `[data-testid="pms-drawer-checklist-input"]`, `[data-testid="pms-drawer-comment-input"]`, `[data-testid="pms-drawer-delete-btn"]`, `[data-testid="pms-drawer-close-btn"]`

### 2.4 `/roadmaps` — Strategic Roadmap (DAG Graph & 5-Tier Execution Pyramid)
- **Entry Point:** `app/roadmaps/page.tsx`
- **Feature Barrel, State Machine & Components:** `features/strategic-roadmap/index.ts` → `features/strategic-roadmap/state/roadmapMachineReducer.ts` (`INV-1` non-orphaned drawer, `INV-2` single-flight synthesis, `INV-3` exclusive modal union), `features/strategic-roadmap/hooks/useRoadmapMachine.ts`, `features/strategic-roadmap/components/BackwardChainTracePanel.tsx`, `components/roadmaps/SynthesisHeaderStrip.tsx`, `CoPilotModeBar.tsx`, `DagCanvasView.tsx` (`hooks/useDagCanvasDragAndArrows.ts`, `DagTierColumn.tsx`, `DagGoalApexCard.tsx`), `ExecutionPyramidView.tsx` (`EditorialPyramidSilhouettes.tsx`), `MobileDagAccordion.tsx`, `TacticalDossierModal.tsx` (`DossierSyncFooter.tsx`), `DoneWithYouModal.tsx`, `ManualNodeBuilderModal.tsx`
- **Services, Types & Data:** `services/roadmapClientService.ts`, `lib/synthesisRoadmapTypes.ts`, `lib/defaultStrategicTrees.ts`, `lib/roadmapVisuals.ts`
- **APIs & Property Specs:** `GET /api/roadmaps`, `POST /api/roadmaps/synthesize` · Property Specs: `tests/properties/roadmaps.bombadil.ts`, `tests/properties/ui-invariants.spec.ts`
- **Deterministic Selectors:**
  - Shell & Root Telemetry: `[data-testid="module-shell-ROADMAPS"]`, `[data-testid="roadmap-workspace-root"]` (`data-view-mode`, `data-async-phase`), `[data-testid="roadmap-feedback-toast"]`, `[data-testid="roadmap-toast-dismiss"]`
  - Domain Menu: `[data-testid="roadmap-domain-selector"]` → `[data-testid="roadmap-domain-option-{master|dogs|health|wealth|family|happiness|custom}"]`
  - Audit & PACE Popover: `[data-testid="roadmap-audit-pace-trigger"]` → `[data-testid="roadmap-pace-btn-{P|A|C|E}"]`
  - **Exclusive View Toggle:** `[data-testid="roadmap-view-toggle-dag"]` | `[data-testid="roadmap-view-toggle-pyramid"]`
  - Backward Chaining Trace: `[data-testid="roadmap-backward-chain-btn"]` → `[data-testid="roadmap-backward-chain-panel"]`, `[data-testid="roadmap-backward-chain-close-btn"]`
  - Synthesize Trigger: `[data-testid="roadmap-synthesize-dag-btn"]`
  - 3-Way Co-Pilot Bar: `[data-testid="copilot-mode-dfy"]`, `[data-testid="copilot-mode-dwy"]`, `[data-testid="copilot-mode-diy"]`, `[data-testid="copilot-goal-input"]`, `[data-testid="copilot-voice-mic-btn"]`, `[data-testid="copilot-generate-dag-btn"]`, `[data-testid="copilot-dwy-launch-btn"]`, `[data-testid="copilot-diy-open-btn"]`
  - Draggable Miro-Style DAG Canvas: `[data-testid="dag-canvas-view"]`, `[data-testid="dag-node-{id}"]`, `[data-testid="dag-node-goal"]`, `[data-testid="dag-reset-layout-btn"]`
  - 5-Tier Execution Pyramid: `[data-testid="execution-pyramid-view"]`, `[data-testid="pyramid-level-1"]` .. `[data-testid="pyramid-level-5"]`, `[data-testid="pyramid-panel-{id}"]`, `[data-testid="pyramid-panel-goal"]`
  - PARDO & FMEA Tactical Dossier Drawer: `[data-testid="pardo-fmea-dossier-drawer"]` (`role="dialog"`), `[data-testid="pardo-fmea-dossier-title"]`, `[data-testid="pardo-fmea-close-btn"]`, `[data-testid="pardo-fmea-add-drill-input"]`, `[data-testid="pardo-fmea-add-drill-btn"]`, `[data-testid="pardo-fmea-sync-pms-btn"]`, `[data-testid="pardo-fmea-sync-calendar-btn"]`, `[data-testid="pardo-fmea-verify-step-btn"]`

### 2.5 `/org-chart` — Architecture Map (Master Planning & Miro Whiteboard)
- **Entry Point:** `app/org-chart/page.tsx`
- **Components:** `components/roadmaps/DagCanvasView.tsx`, `components/topology/TopologyTopBar.tsx`, `TopologyToolbar.tsx`, `customNodes/*`
- **APIs:** `GET /api/architecture/map`, `POST /api/roadmaps/synthesize`
- **Selectors:** `[data-testid="module-shell-ORG_CHART"]`

### 2.6 `/horizon` — Horizon & Zoom
- **Entry Point:** `app/horizon/page.tsx` | **API:** `GET/POST /api/horizon` | **Selector:** `[data-testid="module-shell-HORIZON"]`

### 2.7 `/life-ops` — Life Operations
- **Entry Point:** `app/life-ops/page.tsx` | **API:** `GET/POST /api/life-ops` | **Selector:** `[data-testid="module-shell-LIFE_OPS"]`

### 2.8 `/skills` & `/artifacts` — AI Skills & Artifacts Studios
- **Entry Points:** `app/skills/page.tsx`, `app/artifacts/page.tsx`
- **Selectors:** `[data-testid="module-shell-SKILLS"]`, `[data-testid="module-shell-ARTIFACTS"]`

---

## 3. Health & Performance Routes (`health` Sphere)

### 3.1 `/workouts` — Strength & Training (Titan Bodybuilding Engine)
- **Entry Point:** `app/workouts/page.tsx`
- **Components:** `components/titan/AiVoiceLoggerDock.tsx`, `WorkoutConsistencyHeatmap.tsx` (52-week Jan–Dec grid), `WeeklyRoutineRoadmap.tsx`, `TitanKpiScorecard.tsx`, `ExerciseDeck.tsx`, `BiometricSilhouetteHUD.tsx`
- **APIs:** `/api/titan/ai-log`, `/api/titan/exercises`, `/api/titan/sessions`, `/api/titan/sets`, `/api/titan/templates`
- **Deterministic Selectors:** `[data-testid="module-shell-WORKOUTS"]`, `[data-testid="workouts-tab-dashboard"]`, `[data-testid="workouts-tab-trends"]`

### 3.2 `/macro-ops` — Nutrition & Hydration
- **Entry Point:** `app/macro-ops/page.tsx`
- **Components:** `components/macro-ops/MacroSubheader.tsx`, `CircadianHeatmapStrip.tsx`, `MacroFuelCommandHub.tsx` (`Calories`, `Protein`, `Carbohydrates`, `Fats`), `PolarAdherenceWheelCard.tsx`, `GengarHydrationCard.tsx` (dancing Gengar Hydro-Vessel), `MetabolicFlowSankeyCard.tsx`, `DailyFuelLedgerCard.tsx`, `QuickMealLogModal.tsx`, `components/sitrep/*`
- **APIs:** `GET/POST /api/sitrep`, `GET/POST/DELETE /api/nutrition`, `POST /api/parse-food`
- **Deterministic Selectors:** `[data-testid="module-shell-MACRO_OPS"]`, `[data-testid="water-add-250ml"]`

### 3.3 `/calendar` — Circadian Solar & Unified Google Calendar
- **Entry Point:** `app/calendar/page.tsx`
- **Feature Barrels & Components:** `features/calendar/index.ts` (`CalendarEngineHeader.tsx`), `features/solar-wheel/index.ts` → `components/circadian/CircadianDialStage.tsx` (2400 military dial), `CalendarOpsCommandDeck.tsx`, `CircadianEventModal.tsx`, `components/temporal/*` (`WeeklyRadialView`, `MonthlyRadialView`, `YearlyRadialView`, `GeospatialTacticalMap`), `components/calendar/*` (`MonthView`, `WeekView`, `DayView`, `FourDayView`, `YearView`, `ScheduleView`)
- **APIs & Property Specs:** `/api/circadian`, `/api/circadian/radar`, `/api/calendar-ops`, `/api/calendar-events`, `/api/calendar/google-sync` · Property Specs: `tests/properties/calendar.bombadil.ts`, `tests/properties/ui-invariants.spec.ts`
- **Deterministic Selectors:** `[data-testid="calendar-engine-solar"]`, `[data-testid="calendar-engine-google"]`, `[data-testid="calendar-active-date"]` (`data-active-date="YYYY-MM-DD"`), `[data-testid="calendar-today-btn"]`, `[data-testid="calendar-prev-btn"]`, `[data-testid="calendar-next-btn"]`, `[data-testid="calendar-add-solar-block-btn"]`, `[data-testid="calendar-sync-gcal-btn"]`, `[data-testid="calendar-google-view-dropdown"]`, `[data-testid="calendar-google-view-{day|four_day|month|year|schedule}"]`, `[data-testid="calendar-create-google-event-btn"]`

### 3.4 `/mindset` — Mindset & Clarity (Commander's Counsel)
- **Entry Point:** `app/mindset/page.tsx` | **API:** `GET/POST /api/mindset` | **Selector:** `[data-testid="module-shell-MINDSET"]`

---

## 4. Wealth & Academy Routes (`wealth` Sphere)

### 4.1 `/budget` — Budget, Financial Statements, Shift Calculator & Plaid
- **Entry Point:** `app/budget/page.tsx`
- **APIs:** `GET/POST /api/budget` (includes `purge_year` & `generate_recurring_shifts`), `GET/POST /api/plaid`
- **Deterministic Selectors:**
  - Shell: `[data-testid="module-shell-BUDGET"]`
  - Zero Reset: `[data-testid="budget-reset-zero-btn"]`
  - Financial Statement & Tool Tabs: `[data-testid="budget-tab-overview"]`, `[data-testid="budget-tab-income_statement"]`, `[data-testid="budget-tab-cash_flow"]`, `[data-testid="budget-tab-balance_sheet"]`, `[data-testid="budget-tab-workdays"]`, `[data-testid="budget-tab-plaid"]`

### 4.2 `/caliber-arc` — Caliber Arc Trading Journal & Circuit Guard
- **Entry Point:** `app/caliber-arc/page.tsx` | **API:** `GET/POST /api/trading` | **Selector:** `[data-testid="module-shell-CALIBER_ARC"]`

### 4.3 `/marketing-agent` — Trend Intelligence
- **Entry Point:** `app/marketing-agent/page.tsx` | **API:** `GET/POST /api/marketing-agent` | **Selector:** `[data-testid="module-shell-MARKETING_AGENT"]`

### 4.4 `/education` — Learning Academy
- **Entry Point:** `app/education/page.tsx` | **Data & API:** `lib/educationCurriculum.ts`, `GET/POST /api/education` | **Selector:** `[data-testid="module-shell-EDUCATION"]`

---

## 5. Family & Household Routes (`fam` Sphere)

| Route | Entry File | Components & APIs | Primary Selectors |
| :--- | :--- | :--- | :--- |
| `/pods` | `app/pods/page.tsx` | `components/chairman/pods/*` (`PodContainer`, `HisAndHersDualWheel`, `SharedChoreKanban`) · `/api/pods` | `[data-testid="nav-module-PODS"]` |
| `/family-hub` | `app/family-hub/page.tsx` | Household & dog pack schedules · `/api/family-hub` | `[data-testid="module-shell-FAMILY_HUB"]` |

---

## 6. Settings, Infrastructure & Auxiliary Routes

| Route | Entry File | Purpose & Backing APIs | Primary Selectors |
| :--- | :--- | :--- | :--- |
| `/codebase-diagrams` | `app/codebase-diagrams/page.tsx` | Live Mermaid Architecture Spaces + Freeform Miro Whiteboard · `/api/architecture/map` | `[data-testid="module-shell-CODEBASE_DIAGRAMS"]`, `[data-testid="nav-settings-link-codebase-diagrams"]` |
| `/epistemic` | `app/epistemic/page.tsx` | Epistemic Matrix & decision calibration · `/api/epistemic` | `[data-testid="module-shell-EPISTEMIC"]` |
| `/integrations` | `app/integrations/page.tsx` | MCP / API / Webhook console · `/api/integrations` | `[data-testid="module-shell-INTEGRATIONS"]` |
| `/resources` | `app/resources/page.tsx` | Reference guides & SOP index | `[data-testid="module-shell-RESOURCES"]` |
| `/vault` | `app/vault/page.tsx` | Second-brain Knowledge Vault · `/api/vault` | `[data-testid="module-shell-VAULT"]` |
| `/kpis` | `app/kpis/page.tsx` | `features/kpi-scorecard/index.ts` (`ScorecardHeroBanner`, `ScorecardMatrixTable`, `SectorPhysicsCard`, `SparklineSvg`, `useKpiScorecard`, `personalSectorPhysics`, `executiveSectorPhysics`) · `services/kpiClientService.ts` · `/api/kpi-scorecard`, `/api/metrics` | `[data-testid="kpi-scorecard-root"]`, `[data-testid="kpi-view-{matrix|cards|both}"]`, `[data-testid="kpi-log-checkin-btn"]`, `[data-testid="kpi-checkin-form"]`, `[data-testid="kpi-sector-filter-{all|wealth|health|relate|joy}"]`, `[data-testid="kpi-rag-filter-{all|green|yellow|red}"]`, `[data-testid="kpi-search-input"]`, `[data-testid="kpi-sector-card-{wealth|health|relate|joy}"]`, `[data-testid="kpi-sector-flip-btn-{id}"]`, `[data-testid="kpi-sector-confirm-btn-{id}"]` |
| `/admin` | `app/admin/page.tsx` | **Role Guard: `ADMIN`** (`@features/rbac-governance` `resolveRouteGuard`) · `services/adminService.ts` | `[data-testid="admin-rbac-root"]`, `[data-testid="admin-back-dashboard-link"]`, `[data-testid="admin-user-row-{idx}"]` |
| `/auth/signin` | `app/auth/signin/page.tsx` | **Role Guard: `PUBLIC`** · Google OAuth / NextAuth sign-in · `/api/auth/[...nextauth]` | `[data-testid="auth-signin-root"]`, `[data-testid="auth-google-signin-btn"]` |
| `/overview` | `app/overview/page.tsx` | Redirect alias to `/` | `/` |

---

## 7. FastAPI Contract Engine & RBAC / Pod State Machines (`backend/` & `features/rbac-governance/`)

| Module | File Path | Responsibility & Verification |
| :--- | :--- | :--- |
| **FastAPI App & Scoped CORS** | `backend/main.py`, `backend/store.py` | Explicit `CHAIRMAN_ALLOWED_ORIGINS` CORS policy (wildcard credentialed CORS banned) · `/health` |
| **Circadian Contract Router** | `backend/routers/circadian_router.py`, `backend/schemas/circadian.py` | `/api/v1/circadian/events` (`GET`, `POST`, `DELETE`) · `ConfigDict(extra="forbid")` temporal validation |
| **Zero-Trust Shared Pods Router** | `backend/routers/pods_router.py`, `backend/schemas/pods.py` | `/api/v1/pods/dashboard`, `/api/v1/pods/consent` · `ConfigDict(extra="forbid")` |
| **Pod Consent State Machine** | `backend/state_machines/pod_governance.py` & `features/rbac-governance/state/rbacMachine.ts` | Deterministic lifecycle `DRAFT → PENDING_REVIEW → ACTIVE_GRANT → RESTRICTED → REVOKED` with `OWNER` / `ADMIN` role guards · Verified in `backend/tests/test_contracts.py` & `tests/unit/state-machines.spec.ts` |
| **MCP Sovereign Mesh & Live WS** | `backend/routers/copilot_mcp_router.py` | `/mcp/manifest` (4 typed tool schemas) & `/ws/copilot/live` · Audited by `scripts/audit-skills-and-mcp.mjs` (`npm run audit:skills`) |
