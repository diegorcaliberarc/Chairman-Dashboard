# Chairman Dashboard — Agent Engineering Rules

All agents operating in this repository MUST follow the Always-On engineering standards defined in [.agent/rules/engineering-standards.md](./.agent/rules/engineering-standards.md) and maintain the canonical route & selector registry in [docs/FEATURE_MAP.md](./docs/FEATURE_MAP.md).

## Mandatory Checklist Before Completing Any Task
1. **Plan First:** Multi-file features require an Implementation Plan Artifact before code edits.
2. **Feature Map & `data-testid` Sync:** Every interactive UI control must expose a deterministic `data-testid` documented in `docs/FEATURE_MAP.md`.
3. **Architectural Guardrails:**
   - Max **350 lines** per new file (`max-lines: 350`).
   - Strict feature barrel isolation (`@/features/<slug>` only; never deep sibling imports).
   - Strict data-layer isolation (UI components never import `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`).
   - Zero narrated prompt-history comments and zero dummy data.
4. **Verification Gate (`npm run verify:all` + Browser Subagent):**
   - Run `npm run verify:all` (`tsc --noEmit && npm run lint && npm run build`) — must exit `0`.
   - For any UI or route change, activate [.agent/skills/verify-ui/SKILL.md](./.agent/skills/verify-ui/SKILL.md) to verify live interactive states, console cleanliness, and network health on `http://localhost:3000` via the Browser Subagent, attaching screenshot proof to the Walkthrough Artifact.
