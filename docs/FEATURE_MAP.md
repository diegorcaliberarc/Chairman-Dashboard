# Chairman Dashboard — Agent Navigation, Route & UI Selector Map

> **MANDATORY AGENT MAINTENANCE RULE**
> Every Antigravity agent working in this repository MUST read this file before modifying any route, view switcher, modal, drawer, or navigation control—and MUST update `docs/FEATURE_MAP.md` in the same commit whenever:
> 1. A Next.js route (`app/**/page.tsx`) or API route (`app/api/**/route.ts`) is added, renamed, or removed.
> 2. A view toggle, modal, drawer, or primary interactive control is added or modified.
> 3. Any `data-testid` selector or ARIA dialog role changes.
>
> **Never rely on fragile CSS class selectors** when driving the Browser Subagent (`.agent/skills/verify-ui/SKILL.md`). Always target `[data-testid="..."]` or semantic ARIA roles documented below.

---

## 1. Global Layout Shell, Sidebar Navigation & Universal Modals

| Surface | Entry / Component Path | Backing Services / APIs | Deterministic `data-testid` & ARIA Selectors |
| :--- | :--- | :--- | :--- |
| **Executive Module Shell** | `components/chairman/ExecutiveModuleShell.tsx`<br/> Barrel: `shared/index.ts` | NextAuth session (`useSession`) | `[data-testid="module-shell-{moduleId}"]`<br/>`[data-testid="global-launch-mission-flow-btn"]` |
| **Dual-Column Sticky Sidebar** | `components/Sidebar.tsx`<br/>`components/AppearanceSettings.tsx`<br/>`components/UserAccountModal.tsx` | `/api/ui-preferences`<br/>`/api/calendar/google-sync` | **Home Emblem:** `[data-testid="nav-home-emblem"]`<br/>**Spheres:** `[data-testid="nav-sphere-all"]`, `nav-sphere-operations`, `nav-sphere-health`, `nav-sphere-wealth`, `nav-sphere-fam`, `nav-sphere-happiness`<br/>**Modules:** `[data-testid="nav-module-{ID}"]` (`MASTER`, `COMMAND`, `PMS`, `ROADMAPS`, `ORG_CHART`, `HORIZON`, `LIFE_OPS`, `SKILLS`, `ARTIFACTS`, `WORKOUTS`, `MACRO_OPS`, `CALENDAR_HABITS`, `MINDSET`, `BUDGET`, `CALIBER_ARC`, `MARKETING_AGENT`, `EDUCATION`, `PODS`, `FAMILY_HUB`)<br/>**Avatar & Settings:** `[data-testid="nav-avatar-menu-trigger"]`, `[data-testid="nav-settings-popover"]`, `[data-testid="nav-settings-link-codebase-diagrams"]`, `nav-settings-link-epistemic`, `nav-settings-link-integrations`, `nav-settings-link-resources`, `nav-settings-link-vault`<br/>**Theme Studio (Sole Theme Switcher):** `[data-testid="nav-theme-palette-trigger"]` |
| **Guided Mission Flow Navigator (6-Stage Engine)** | `components/mission/MissionFlowNavigatorModal.tsx`<br/>`lib/missionFlowTypes.ts`<br/> Barrel: `features/mission-flow/index.ts` | `GET/POST /api/mission-flow`<br/>Cross-syncs to `pms_tasks` & `yearly_appointments` | **Dialog:** `[data-testid="mission-flow-modal"]` (`role="dialog"` `aria-modal="true"`), `[data-testid="mission-close-btn"]`<br/>**Co-Pilot Modes:** `[data-testid="mission-mode-dfy"]`, `mission-mode-dwy`, `mission-mode-diy`<br/>**DFY Synthesizer:** `[data-testid="mission-dfy-input"]`, `[data-testid="mission-dfy-run-btn"]`<br/>**6-Stage Stepper:** `[data-testid="mission-stage-tab-0"]` (OOCEMR) .. `mission-stage-tab-5` (HUD & AAR Vault)<br/>**Deploy:** `[data-testid="mission-deploy-btn"]` |
| **Theme-Adaptive Pixel Companion** | `components/chairman/pixel-pals/DittoGengarPals.tsx`<br/>`components/GlassThemeController.tsx` | `lib/glassTheme.ts`, `lib/fontTheme.ts` | Ambient companion mounted globally in `app/layout.tsx` |

---

## 2. Operations & Planning Routes (`operations` Sphere)

### 2.1 `/` — Home Dashboard
- **Entry Point:** `app/page.tsx`
- **APIs & Persistence:** `/api/widgets`, `/api/ui-preferences`, `localStorage` widget layout state
- **Key Interactive Controls:** Customizable drag-and-drop widget grid, sphere quick-launchers, `[data-testid="module-shell-MASTER"]`.

### 2.2 `/command` — Operations & Strategy (Command Center)
- **Entry Point:** `app/command/page.tsx`
- **Components:** `components/command/NorthStarAnchorCard.tsx`, `DomainScorecardGrid.tsx`, `WeeklyFragoPaceEditor.tsx`, `PhasesTransitionSequence.tsx`, `AarLessonVault.tsx`, `SundayReviewWizardModal.tsx`, `DriftWarningBanner.tsx`
- **APIs & Types:** `GET/POST /api/command`, `GET/POST /api/scorecard`, `lib/commandTypes.ts`
- **Key Selectors:** `[data-testid="module-shell-COMMAND"]`, `[data-testid="global-launch-mission-flow-btn"]`.

### 2.3 `/pms` — Project Management (Pristine PMS)
- **Entry Point:** `app/pms/page.tsx`
- **Components & Types:** `components/pms/PmsHierarchySidebar.tsx`, `TaskDetailModal.tsx`, `NewSpaceModal.tsx`, `lib/pmsTypes.ts`
- **APIs:** `GET/POST/PATCH/DELETE /api/pms`, cross-syncs AI commands to `/api/sitrep` & `/api/parse-food`
- **Deterministic Selectors:**
  - Shell: `[data-testid="module-shell-PMS"]`
  - Universal AI Command Input: `[data-testid="pms-ai-command-input"]`
  - View Switcher Tabs: `[data-testid="pms-view-home"]`, `[data-testid="pms-view-overview"]`, `[data-testid="pms-view-list"]`, `[data-testid="pms-view-board"]`

### 2.4 `/roadmaps` — Strategic Roadmap (DAG Graph & 5-Tier Execution Pyramid)
- **Entry Point:** `app/roadmaps/page.tsx`
- **Feature Barrel & Components:** `features/strategic-roadmap/index.ts` → `components/roadmaps/SynthesisHeaderStrip.tsx`, `CoPilotModeBar.tsx`, `DagCanvasView.tsx`, `ExecutionPyramidView.tsx`, `MobileDagAccordion.tsx`, `TacticalDossierModal.tsx`, `DoneWithYouModal.tsx`, `ManualNodeBuilderModal.tsx`
- **Types & Data:** `lib/synthesisRoadmapTypes.ts`, `lib/defaultStrategicTrees.ts`, `lib/roadmapVisuals.ts`
- **APIs:** `GET /api/roadmaps`, `POST /api/roadmaps/synthesize`
- **Deterministic Selectors:**
  - Shell: `[data-testid="module-shell-ROADMAPS"]`
  - Domain Menu: `[data-testid="roadmap-domain-selector"]` → `[data-testid="roadmap-domain-option-{master|dogs|health|wealth|family|happiness|custom}"]`
  - Audit & PACE Popover: `[data-testid="roadmap-audit-pace-trigger"]` → `[data-testid="roadmap-pace-btn-{P|A|C|E}"]`
  - **Exclusive View Toggle:** `[data-testid="roadmap-view-toggle-dag"]` | `[data-testid="roadmap-view-toggle-pyramid"]`
  - Backward Chaining Trace: `[data-testid="roadmap-backward-chain-btn"]` → `[data-testid="roadmap-backward-chain-panel"]`, `[data-testid="roadmap-backward-chain-close-btn"]`
  - Synthesize Trigger: `[data-testid="roadmap-synthesize-dag-btn"]`
  - 3-Way Co-Pilot Bar: `[data-testid="copilot-mode-dfy"]`, `[data-testid="copilot-mode-dwy"]`, `[data-testid="copilot-mode-diy"]`, `[data-testid="copilot-goal-input"]`, `[data-testid="copilot-voice-mic-btn"]`, `[data-testid="copilot-generate-dag-btn"]`
  - Draggable Miro-Style DAG Canvas: `[data-testid="dag-canvas-view"]`, `[data-testid="dag-node-{id}"]`, `[data-testid="dag-node-goal"]`
  - 5-Tier Execution Pyramid: `[data-testid="execution-pyramid-view"]`, `[data-testid="pyramid-level-1"]` .. `[data-testid="pyramid-level-5"]`, `[data-testid="pyramid-panel-{id}"]`, `[data-testid="pyramid-panel-goal"]`
  - PARDO & FMEA Tactical Dossier Drawer: `[data-testid="pardo-fmea-dossier-drawer"]` (`role="dialog"`), `[data-testid="pardo-fmea-close-btn"]`

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
- **Feature Barrel & Components:** `features/solar-wheel/index.ts` → `components/circadian/CircadianDialStage.tsx` (2400 military dial), `CalendarOpsCommandDeck.tsx`, `CircadianEventModal.tsx`, `components/temporal/*` (`WeeklyRadialView`, `MonthlyRadialView`, `YearlyRadialView`, `GeospatialTacticalMap`), `components/calendar/*` (`MonthView`, `WeekView`, `DayView`, `FourDayView`, `YearView`, `ScheduleView`)
- **APIs:** `/api/circadian`, `/api/circadian/radar`, `/api/calendar-ops`, `/api/calendar-events`, `/api/calendar/google-sync`
- **Deterministic Selectors:** `[data-testid="calendar-engine-solar"]`, `[data-testid="calendar-engine-google"]`

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
| `/kpis` | `app/kpis/page.tsx` | Executive KPI Scorecard · `/api/kpi-scorecard`, `/api/metrics` | `/kpis` |
| `/admin` | `app/admin/page.tsx` | System administration | `/admin` |
| `/auth/signin` | `app/auth/signin/page.tsx` | Google OAuth / NextAuth sign-in · `/api/auth/[...nextauth]` | `/auth/signin` |
| `/overview` | `app/overview/page.tsx` | Redirect alias to `/` | `/` |
