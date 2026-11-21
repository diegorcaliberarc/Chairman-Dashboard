# Chairman Dashboard — Pattern-Buffer Tech Debt Queue (v3.2)

> **Chief of Staff Pattern Buffer Protocol**
> Whenever an agent discovers an out-of-scope legacy smell, oversized file (`>350` lines), raw `useEffect(() => fetch(...))` chain, or imperative timer during feature work or background audits, **log it here** rather than opening scattered micro-PRs. Batch clean decompositions whenever touching a queued domain.

## Current Legacy Ratchet Baseline (Commit `9cd6bfa8`)
- **Grandfathered `LEGACY_OVERSIZED_ALLOWLIST` Count:** `70` files *(down from `77` in v1 after decomposing `app/kpis/page.tsx`, `app/roadmaps/page.tsx`, `DagCanvasView.tsx`, `ExecutionPyramidView.tsx`, `TacticalDossierModal.tsx`, `MissionFlowNavigatorModal.tsx`, and `app/pms/page.tsx`)*
- **Current Legacy ESLint Warnings:** `147` *(hard CI ceiling locked at `--max-warnings=151` in `package.json` and `scripts/verify-all.mjs`)*
- **Modern Layers (`features/**`, `shared/**`, `services/**`):** `0` errors, `0` warnings (`--max-warnings=0`, `noInlineConfig: true`)

---

## Top 5 Highest-Leverage Legacy Decomposition Candidates

| Rank | File Path | Total Lines | Import Centrality / Blast Radius | Target Feature Module & Decomposition Blueprint | Risk Door | Status |
| :-: | :--- | :---: | :--- | :--- | :---: | :---: |
| **1** | `app/horizon/page.tsx` | **2,074** | Medium — Multi-horizon altitude & zoom planning route | Extract `features/horizon/` (`horizonMachine.ts`, altitude panels, `services/horizonClientService.ts`) and remove from `LEGACY_OVERSIZED_ALLOWLIST` | Two-Way | Queued |
| **2** | `components/circadian/CircadianDialStage.tsx` | **1,968** | **High** — Core 2400 solar wheel rendered on `/calendar` | Split SVG arc geometry math, outer photo wedges, and pointer scrubber into `features/solar-wheel/` (preserving military time & circular wheel visuals) | Two-Way | Queued |
| **3** | `app/vault/page.tsx` | **1,942** | Medium — Second-brain Knowledge Vault route & modals | Extract `features/knowledge-vault/` (`useVaultWorkspace`, note editor drawer, `services/vaultClientService.ts`) | Two-Way | Queued |
| **4** | `app/education/page.tsx` | **1,915** | Medium — Learning Academy route & curriculum tracker | Extract `features/education/` (`curriculumReducer`, module/lesson panels, `services/educationClientService.ts`) | Two-Way | Queued |
| **5** | `components/chairman/pixel-pals/DittoGengarPals.tsx` | **1,866** | **Global** — Mounted in `app/layout.tsx` across all 46 routes | Split sprite state registry, animation frame controller, and companion dock UI into `features/pixel-pals/` | Two-Way | Queued |

---

## Systemic Pattern Buffer (Cross-Cutting Audit Findings)

| Pattern ID | Recurring Smell | Affected Scope | Target Permanent Guardrail |
| :--- | :--- | :--- | :--- |
| **`PAT-01`** | Legacy `useEffect(() => fetch(...))` chains inside `app/**/page.tsx` | Remaining legacy routes outside `features/**` | Migrate to `services/<domain>ClientService.ts` + feature hooks whenever a route is touched |
| **`PAT-02`** | Imperative `setTimeout` toast timers in legacy modals | Pre-v3 legacy components (`components/**`) | Replace with reducer-driven dismissible banners or CSS `onAnimationEnd` |
| **`PAT-03`** | Unused legacy modal (`components/pms/TaskDetailModal.tsx`, `805` lines) | Superseded by `features/pms/components/TaskDetailDrawer.tsx` | Confirm zero remaining external imports and delete in next PMS cleanup batch (`LEGACY_OVERSIZED_ALLOWLIST`: `70 → 69`) |
| **`PAT-04`** | Split PMS table writes (`pms_tasks` v1 & `prisma.task` vs `pms_tasks_v2`) | `/command`, `/roadmaps`, `/marketing-agent`, `/pods`, `/mindset` | Extract unified `lib/pmsV2Writer.ts` helper so every cross-module push writes to `pms_lists_v2`/`pms_tasks_v2` (see `docs/WORKFLOW_AUDIT_REPORT.md`) |
| **`PAT-05`** | Silent API contract mismatches (`data.items` vs `events`, `{ prompt }` vs `{ input }`, nested `{ appointment }`) | `/`, `/workouts`, `/calendar`, `/mindset` | Fix payload keys and add typed contract parity checks in `tests/fixtures/apiContractMocks.ts` |
