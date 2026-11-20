# Chairman Dashboard — Agent Engineering Rules (v3.2 Autonomous Software Factory)

All agents operating in this repository MUST follow Lauren Tan's **Inverse Pyramid of Agent Environment Trust** + **2026 AI Engineer Code Summit** standards codified in [.agents/rules/engineering-standards.md](./.agents/rules/engineering-standards.md) (`trigger: always_on`), maintain [docs/FEATURE_MAP.md](./docs/FEATURE_MAP.md), and log out-of-scope legacy smells in [docs/TECH_DEBT_QUEUE.md](./docs/TECH_DEBT_QUEUE.md).

## Mandatory Pre-Completion Checklist (v3.2)
1. **Atomic Checkpoint, Risk Classification, Plan & State-Chart First:**
   - Verify a clean git checkpoint (`npm run checkpoint -- --verify`) before multi-file refactors so failed experiments revert cleanly.
   - Multi-file features require an Implementation Plan Artifact before source edits, classified at the top as either:
     - **Two-Way Door (Reversible):** Isolated UI components, styling updates, additive tests, non-destructive refactors → cleared for fast execution once Gates 1–3 pass.
     - **One-Way Door (Irreversible / High-Risk):** Prisma schema migrations (`prisma/schema.prisma`), Supabase RLS/RBAC permission changes (`features/rbac-governance/**`, `backend/state_machines/**`), authentication flows (`app/api/auth/**`, `lib/auth.ts`), or external billing/API mutations (`app/api/plaid/**`) → requires `state-chart` proof, rollback SQL/migration plan, and explicit human sign-off before execution or merge.
   - Multi-state UI views, drawers, modals, or RBAC/business lifecycles require [.agents/skills/state-chart/SKILL.md](./.agents/skills/state-chart/SKILL.md) (explicit TypeScript/Python state machines + Before/After Mermaid `stateDiagram-v2` state charts & invariants in `walkthrough.md`).
2. **Tier-1 & Tier-2 Architectural Guardrails (Repo-Wide Zero Escape Hatches):**
   - Max **350 lines** per file (`max-lines: 350`). Pull weeds when touching legacy files on `LEGACY_OVERSIZED_ALLOWLIST`, remove split files from the allowlist, and log out-of-scope smells in `docs/TECH_DEBT_QUEUE.md`.
   - **Zero suppression escape hatches repo-wide:** `eslint-disable*`, `@ts-ignore`, `@ts-nocheck`, and Python `# type: ignore` are banned (`noInlineConfig: true` + `chairman/no-suppression-escapes`).
   - **Anti-Tautology Test Enforcement:** `chairman/no-tautological-tests` bans self-mirroring assertions (`expect(x).toBe(x)`, `expect(true).toBe(true)`) across `tests/**/*.{ts,tsx}`. Every test must assert behavioral state transitions, forbidden-state rejections (`INV-*`), HTTP `422`/`403`/`409` schema rejections, or DOM contracts.
   - **Zero foot-gun APIs:** No `setTimeout`/`setInterval`/`requestAnimationFrame` and no raw `useEffect(() => fetch(...))` chains inside `features/**`, `shared/**`, or `services/**`.
   - Strict feature barrel isolation (`@features/<slug>` only), strict UI data-layer isolation, `ConfigDict(extra="forbid")` on inbound FastAPI Pydantic DTOs, and zero narrated comments / dummy data.
3. **Tier-3A Spend/Production Isolation, Zenity Security Gate & `recall` Friction Mining:**
   - Tests (`Playwright`, `Vitest`, `pytest`) MUST scrub live `.env` secrets and block outbound requests to Supabase, Stripe, Plaid, and LLM endpoints.
   - All skills in `.agents/skills/**/SKILL.md` and MCP manifests MUST pass `npm run audit:skills`.
   - Whenever repeated user corrections or recurring bugs occur, invoke [.agents/skills/recall/SKILL.md](./.agents/skills/recall/SKILL.md) to classify Feedforward vs. Feedback failures and promote permanent guardrails.
4. **Tier-3B & Tier-4 Proof-of-Work Verification Chain (All Must Pass):**
   - **Gate 1 (Machine-Readable 7-Stage CLI):** `npm run verify:all:json` (`typecheck`, `lint:strict`, `lint` `--max-warnings=151`, `audit:skills`, `test:unit`, `pytest`, `next build`) — `ok: true` (`exit 0`).
   - **Gate 2 (Spend-Isolated Property Fuzzing):** `npm run test:properties` (`5` suites on isolated port `3100`, `0` outbound prod calls) — `exit 0`.
   - **Gate 3 (Live Browser Subagent Proof):** Execute [.agents/skills/verify-ui/SKILL.md](./.agents/skills/verify-ui/SKILL.md) on `http://localhost:3000` and attach JSON gate output, risk classification, state charts, console/network counts, and screenshots to `walkthrough.md`.
