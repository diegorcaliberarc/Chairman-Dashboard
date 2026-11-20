# Chairman Dashboard — Agent Engineering Rules (v2 Autonomous Software Factory)

All agents operating in this repository MUST follow Lauren Tan's Inverse Pyramid of Agent Environment Trust codified in [.agent/rules/engineering-standards.md](./.agent/rules/engineering-standards.md) and maintain the canonical route & selector registry in [docs/FEATURE_MAP.md](./docs/FEATURE_MAP.md).

## Mandatory Checklist Before Completing Any Task
1. **Plan & State-Chart First:**
   - Multi-file features require an Implementation Plan Artifact before code edits.
   - Multi-state UI views, drawers, modals, or async workflows require [.agent/skills/state-chart/SKILL.md](./.agent/skills/state-chart/SKILL.md) (typed `useReducer` state machine + Before/After Mermaid `stateDiagram-v2` state charts & invariants in `walkthrough.md`).
2. **Feature Map & `data-testid` Sync:**
   - Every interactive UI control must expose a deterministic `data-testid` documented in `docs/FEATURE_MAP.md`.
3. **Tier-1 & Tier-2 Architectural Guardrails (Zero Escape Hatches):**
   - Max **350 lines** per file (`max-lines: 350`). Pull weeds when touching legacy files on `LEGACY_OVERSIZED_ALLOWLIST` and remove split files from the allowlist.
   - **Zero suppression escape hatches:** `eslint-disable*`, `@ts-ignore`, and `@ts-nocheck` are banned (`noInlineConfig: true` + `chairman/no-suppression-escapes`).
   - **Zero foot-gun APIs:** No `setTimeout`/`setInterval`/`requestAnimationFrame` and no raw `useEffect(() => fetch(...))` chains inside `features/**`, `shared/**`, or `services/**`.
   - Strict feature barrel isolation (`@features/<slug>` only) and strict data-layer isolation (UI never imports `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`).
   - Zero narrated prompt-history comments and zero dummy data.
4. **3-Gate Verification Procedure (All Must Pass):**
   - **Gate 1 (Static & Build):** `npm run lint:strict` + `npm run verify:all` (`tsc --noEmit && npm run lint && npm run build`) — exit `0`.
   - **Gate 2 (Property Fuzzing):** `npm run test:properties` (Playwright + `fast-check` + `@antithesishq/bombadil` property specs in `tests/properties/`) — exit `0`.
   - **Gate 3 (Visual & State-Chart Proof):** Run [.agent/skills/verify-ui/SKILL.md](./.agent/skills/verify-ui/SKILL.md) via the Browser Subagent on `http://localhost:3000` and attach screenshots + state charts to `walkthrough.md`.
