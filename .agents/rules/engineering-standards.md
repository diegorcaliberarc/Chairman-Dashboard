---
trigger: always_on
---

# Chairman Dashboard — Autonomous Software Factory v3.0 Engineering Standards

All agents operating in this repository MUST follow Lauren Tan's **Inverse Pyramid of Agent Environment Trust** integrated with the **2026 AI Engineer Code Summit** standards (`Deterministic Architecture → Self-Teaching Static Analysis → Spend-Isolated & Proof-of-Work Runtime Verification → Atomic Governance`):

## 1. Tier 1 — Deterministic Architecture, Directory Isolation & Active Weed-Pulling
- **Feature Co-Location & Public Barrels:** Self-contained domain modules live in `features/<slug>/**` (`strategic-roadmap`, `kpi-scorecard`, `calendar`, `mission-flow`, `rbac-governance`, `solar-wheel`) with explicit public `index.ts` barrels (`@features/<slug>`). Deep cross-feature internal imports (`@features/<sibling>/*`) are strictly forbidden.
- **350-Line Cap (`max-lines: 350`) & Active Weed-Pulling:**
  - Hard `error` on all new files, `features/**`, `shared/**`, and `services/**` (`skipBlankLines: true`, `skipComments: true`).
  - Whenever an agent touches a legacy file on `LEGACY_OVERSIZED_ALLOWLIST` in `eslint.config.mjs`, extract cohesive subcomponents/hooks `<350` lines (never grow a legacy file). Whenever splitting a legacy file below 350 lines, remove it from `LEGACY_OVERSIZED_ALLOWLIST` in the same PR.
- **Ban Nuance Foot-Guns & Narrated Comments:**
  - Zero raw `useEffect(() => fetch(...))` chains and zero unmanaged imperative timers (`setTimeout`, `setInterval`, `requestAnimationFrame`) in `features/**`, `shared/**`, or `services/**`. Use `services/<domain>ClientService.ts`, CSS transitions, `useLayoutEffect` + `ResizeObserver`, or dedicated hooks in `lib/hooks/`.
  - UI components and client pages MUST NEVER import `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`.
  - Ban conversational prompt-history comments (`// As requested...`, `// Round 2 fix...`); permit JSDoc (`/** ... */`) and non-obvious algorithmic/domain explanations.
- **Deterministic State Machines Over Boolean Guessing:**
  - Model multi-step business lifecycles, RBAC/consent transitions, and multi-panel UI workspaces (`roadmapReducer`, `missionFlowReducer`, `transitionConsentLifecycle`, `transition_pod_consent`) as explicit TypeScript/Python state machines rather than ad-hoc booleans.

## 2. Tier 2 — Self-Teaching Static Analysis, Zero Escape Hatches & Anti-Tautology
- **Zero Suppression Escape Hatches Repo-Wide:** `linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" }` + `chairman/no-suppression-escapes` forbid `eslint-disable*`, `@ts-ignore`, and `@ts-nocheck` across TypeScript, and `# type: ignore` is forbidden in `backend/`. Always resolve the root architectural or type boundary issue.
- **Anti-Tautology Test Enforcement (`chairman/no-tautological-tests`):** Enforced as an `error` on `tests/**/*.{ts,tsx}`. Every `it(...)` / `test(...)` block must assert behavioral state transitions, forbidden-state rejections (`INV-1..INV-7`, `INV-PMS-1..4`), schema validation errors (`422`/`403`/`409`), or DOM visibility/accessibility contracts—never `expect(x).toBe(x)` or trivial constant-to-constant mirrors.
- **Strict Build & DTO Validation:** Keep `typescript.ignoreBuildErrors: false` in `next.config.mjs` and `ConfigDict(extra="forbid")` on inbound FastAPI Pydantic mutation DTOs.

## 3. Tier 3A — Strict Production/Spend Isolation & Skill Security Audit
- **Zero Live Production Calls in Tests (Keiji Kanazawa Rule):** All test runners (`Playwright`, `Vitest`, `pytest`) MUST scrub live `.env` credentials (`DATABASE_URL`, `SUPABASE_*`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `STRIPE_*`, `PLAID_*`) and block outbound requests to production databases, payment gateways, and paid LLM endpoints via `tests/fixtures/isolatedBrowserFixture.ts`, `tests/setup/vitest.isolation.ts`, and `backend/tests/conftest.py`.
- **Skill & MCP Security Audit (Zenity Rule):** Every skill in `.agents/skills/**/SKILL.md` and every MCP manifest must pass `npm run audit:skills` (clean `name` + `description` YAML frontmatter, `<24 KB` rule size, scoped explicit CORS origins, `additionalProperties: false` tool schemas, zero credential exfiltration patterns).

## 4. Tier 3B — Chin & Chin Proof-of-Work Verification Chain
- **Navigation GPS (`docs/FEATURE_MAP.md` + `data-testid`):** Read `docs/FEATURE_MAP.md` before modifying routes/modals/drawers, expose deterministic `data-testid` attributes on every interactive control, and update `docs/FEATURE_MAP.md` in the same commit.
- **State-Chart Visual Verification (`.agents/skills/state-chart/SKILL.md`):** Embed Before/After Mermaid `stateDiagram-v2` state charts + an explicit Forbidden-State Invariant Table in `walkthrough.md` whenever modifying multi-state UI views or workflow lifecycles.
- **Property Fuzzing (`npm run test:properties`) & Browser Subagent Proof (`.agents/skills/verify-ui/SKILL.md`):** Run isolated property fuzzing and live Browser Subagent verification on localhost, embedding machine-readable gate JSON, console/network audit counts (`0` errors, `0` HTTP `4xx`/`5xx`), and screenshots in `walkthrough.md`.

## 5. Tier 4 — Atomic Git Checkpoints, Risk Classification, Tech-Debt Queue & CLI Gate
- **Two-Way Door vs. One-Way Door Risk Classification:** Every `implementation_plan.md` and `walkthrough.md` MUST declare its risk class at the top:
  - **Two-Way Door (Reversible):** Isolated UI components, styling updates, additive tests, non-destructive refactors → fast execution once Gates 1–3 pass.
  - **One-Way Door (Irreversible / High-Risk):** `prisma/schema.prisma` migrations, Supabase RLS/RBAC permission changes, authentication flows (`app/api/auth/**`), or external billing/API mutations → requires `state-chart` proof, rollback SQL/migration plan, and explicit human sign-off before execution or merge.
- **Pattern-Buffer Tech Debt Queue (`docs/TECH_DEBT_QUEUE.md`) & `recall` Skill:** Log out-of-scope legacy smells in `docs/TECH_DEBT_QUEUE.md` instead of scattered micro-PRs, and run `.agents/skills/recall/SKILL.md` whenever repeated human corrections occur.
- **Atomic Git Checkpoints:** Run `npm run checkpoint` (or verify clean `git status` / create a dedicated worktree) before multi-file refactors so failed experiments revert cleanly without stacking reactive patches.
- **Machine-Readable CLI Gate:** Run `npm run verify:all:json` (`scripts/verify-all.mjs --json`) to validate `typecheck`, `lint:strict`, `lint` (`--max-warnings=151`), `audit:skills`, `test:unit`, `pytest`, and `next build` in compact structured output.
