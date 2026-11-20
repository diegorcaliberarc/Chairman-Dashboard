# Chairman Dashboard — Agent Engineering Rules (v3.0 Autonomous Software Factory)

All agents operating in this repository MUST follow Lauren Tan's **Inverse Pyramid of Agent Environment Trust** + **2026 AI Engineer Code Summit** standards codified in [.agents/rules/engineering-standards.md](./.agents/rules/engineering-standards.md) (`trigger: always_on`) and maintain [docs/FEATURE_MAP.md](./docs/FEATURE_MAP.md).

## Mandatory Pre-Completion Checklist (v3.0)
1. **Atomic Checkpoint, Plan & State-Chart First:**
   - Verify a clean git checkpoint (`npm run checkpoint -- --verify`) before multi-file refactors so failed experiments revert cleanly.
   - Multi-file features require an Implementation Plan Artifact before source edits.
   - Multi-state UI views, drawers, modals, or RBAC/business lifecycles require [.agents/skills/state-chart/SKILL.md](./.agents/skills/state-chart/SKILL.md) (explicit TypeScript/Python state machines + Before/After Mermaid `stateDiagram-v2` state charts & invariants in `walkthrough.md`).
2. **Tier-1 & Tier-2 Architectural Guardrails (Repo-Wide Zero Escape Hatches):**
   - Max **350 lines** per file (`max-lines: 350`). Pull weeds when touching legacy files on `LEGACY_OVERSIZED_ALLOWLIST` and remove split files from the allowlist.
   - **Zero suppression escape hatches repo-wide:** `eslint-disable*`, `@ts-ignore`, `@ts-nocheck`, and Python `# type: ignore` are banned (`noInlineConfig: true` + `chairman/no-suppression-escapes`).
   - **Zero foot-gun APIs:** No `setTimeout`/`setInterval`/`requestAnimationFrame` and no raw `useEffect(() => fetch(...))` chains inside `features/**`, `shared/**`, or `services/**`.
   - Strict feature barrel isolation (`@features/<slug>` only), strict UI data-layer isolation, `ConfigDict(extra="forbid")` on inbound FastAPI Pydantic DTOs, and zero narrated comments / dummy data.
3. **Tier-3A Spend/Production Isolation & Zenity Security Gate:**
   - Tests (`Playwright`, `Vitest`, `pytest`) MUST scrub live `.env` secrets and block outbound requests to Supabase, Stripe, Plaid, and LLM endpoints.
   - All skills in `.agents/skills/**/SKILL.md` and MCP manifests MUST pass `npm run audit:skills`.
4. **Tier-3B & Tier-4 Proof-of-Work Verification Chain (All Must Pass):**
   - **Gate 1 (Machine-Readable 7-Stage CLI):** `npm run verify:all:json` (`typecheck`, `lint:strict`, `lint`, `audit:skills`, `test:unit`, `pytest`, `next build`) — `ok: true` (`exit 0`).
   - **Gate 2 (Spend-Isolated Property Fuzzing):** `npm run test:properties` (`4` suites on isolated port `3100`, `0` outbound prod calls) — `exit 0`.
   - **Gate 3 (Live Browser Subagent Proof):** Execute [.agents/skills/verify-ui/SKILL.md](./.agents/skills/verify-ui/SKILL.md) on `http://localhost:3000` and attach JSON gate output, state charts, console/network counts, and screenshots to `walkthrough.md`.
