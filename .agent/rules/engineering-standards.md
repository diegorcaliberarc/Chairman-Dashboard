# Chairman Dashboard — Autonomous Engineering Standards (v2 Software Factory)

All agents operating in this repository MUST follow Lauren Tan's **Inverse Pyramid of Agent Environment Trust** (`Deterministic Architecture → Self-Teaching Static Analysis → Runtime & Property Verification → Minimal Prose`):

## 1. Artifact-First Planning, State-Chart First & Feature Map Sync
- **Implementation Plan First:** Before editing multi-file features, routes, or database schemas, produce an Implementation Plan Artifact proposing the exact file structure, barrel exports, state transitions, and data flow.
- **State-Chart First on Multi-State UI (`.agent/skills/state-chart/SKILL.md`):**
  - Activate `.agent/skills/state-chart/SKILL.md` whenever creating or modifying multi-state UI views, drawers, modals, or async workflows (specifically `/roadmaps`, `/calendar` Circadian Solar Wheel, `/pms`, `/kpis`, and `MissionFlowNavigatorModal`).
  - Model coupled UI states via typed `useReducer` state machines (`features/<slug>/state/` + `features/<slug>/hooks/`) enforcing explicit invariants (e.g., no orphaned drawers on domain/tree switches, single-flight async guards, exclusive discriminated-union modal stacks).
  - Embed **Before** and **After** Mermaid `stateDiagram-v2` state charts + an Invariants Table inside `walkthrough.md`.
- **Consult & Maintain `docs/FEATURE_MAP.md`:**
  - Read `docs/FEATURE_MAP.md` before modifying any route, modal, drawer, or navigation item.
  - Add deterministic `data-testid` attributes to every new interactive control, button, tab toggle, input, modal, and drawer.
  - Update `docs/FEATURE_MAP.md` in the same task whenever a route, drawer, modal, API endpoint, or `data-testid` is added or changed.

## 2. Atomic Modular Changes, Mandatory Weed-Pulling & Zero Escape Hatches
- **350-Line Cap (`max-lines: 350`) & Mandatory Weed-Pulling:**
  - Never create a file exceeding 350 lines (excluding blank lines and comments).
  - **Mandatory Weed-Pulling:** Whenever touching a grandfathered legacy file on `LEGACY_OVERSIZED_ALLOWLIST` in `eslint.config.mjs`, extract cohesive subcomponents/hooks `<350` lines into `features/<slug>/` (never grow a legacy file). Whenever splitting a legacy file below 350 lines, remove it from `LEGACY_OVERSIZED_ALLOWLIST` in the same commit.
- **Zero Suppression Escape Hatches (`noInlineConfig: true`):**
  - Never add `eslint-disable`, `eslint-disable-next-line`, `@ts-ignore`, or `@ts-nocheck` comments. Both ESLint (`noInlineConfig: true` + `chairman/no-suppression-escapes`) and review gates forbid inline suppressions—always solve the root architectural or type boundary issue.
- **Zero Imperative Timer Hacks & Zero Raw `useEffect` Fetch Chains:**
  - Do not use `setTimeout`, `setInterval`, or `requestAnimationFrame` in `features/**`, `shared/**`, or `services/**`. Use CSS transitions/`onAnimationEnd`, `useLayoutEffect` + `ResizeObserver`, reducer state machines, or dedicated hooks in `lib/hooks/`.
  - Never write raw `useEffect(() => { fetch(...) })` chains in `features/**`; route network I/O through `services/<domain>ClientService.ts` + dedicated hooks or Server Components.
- **Feature Co-Location & Data-Layer Isolation:**
  - Self-contained features live under `features/<slug>/` with an explicit public `index.ts` barrel (`@features/<slug>`). Never import deep internal paths of sibling features (`@features/<sibling>/*`).
  - UI components (`components/**`, `features/**/components/**`, and client `app/**/page.tsx`) MUST NEVER import `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`.
- **Clean Engineering Comments Only:**
  - Never write narrated prompt-history comments (`// As requested by the user`, `// Round 4 fix`). Use JSDoc (`/** ... */`) only where non-obvious domain math or state invariants warrant explanation.

## 3. Zero Dummy Data & Design System Fidelity
- Never seed fake dollar amounts, fake workouts, or placeholder streaks—initialize empty user states cleanly at `0` / empty arrays.
- Preserve theme-adaptive CSS variables (`--glass-surface`, `--glass-border`, `--glass-text-primary`, `--glass-text-muted`) and the two-font hierarchy (`EB Garamond` 500 display + `Geist` 400/500 UI). Theme switching belongs exclusively in the bottom-left Sidebar Palette control.

## 4. Mandatory Three-Gate Verification Procedure
Never mark a UI or full-stack task complete until ALL THREE verification gates pass:
1. **Gate 1 — Self-Teaching Static & Production Build Gate:**
   - Run `npm run lint:strict` (`--max-warnings=0` on `features`, `shared`, `services`) and `npm run verify:all` (`tsc --noEmit && npm run lint && npm run build`) — must exit `0`.
2. **Gate 2 — Property-Based UI Fuzzing Gate:**
   - Run `npm run test:properties` (`@antithesishq/bombadil` LTL specs + Playwright/`fast-check` randomized property fuzzing in `tests/properties/`) — must exit `0` with zero uncaught page exceptions and zero hydration/console errors.
3. **Gate 3 — Live Browser Subagent & State-Chart Proof:**
   - Execute `.agent/skills/verify-ui/SKILL.md` against `http://localhost:3000` via the Browser Subagent and `.agent/skills/state-chart/SKILL.md` (when modifying multi-state UI), embedding screenshots + Before/After Mermaid `stateDiagram-v2` charts in `walkthrough.md`.
