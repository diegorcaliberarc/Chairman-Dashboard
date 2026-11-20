---
trigger: always_on
description: Core engineering standards, architectural guardrails, and mandatory autonomous verification gates for Chairman Dashboard.
---

# Chairman Dashboard — Autonomous Engineering Standards

All agents working in this repository MUST follow these four non-negotiable engineering standards on every task:

## 1. Artifact-First Planning & Feature Map Sync
- **Implementation Plan First:** Before editing multi-file features, routes, or database schemas, produce an Implementation Plan Artifact proposing the exact file structure, barrel exports, and data flow.
- **Consult & Maintain `docs/FEATURE_MAP.md`:**
  - Read `docs/FEATURE_MAP.md` before modifying any route, modal, drawer, or navigation item.
  - Add deterministic `data-testid` attributes to every new interactive control, button, tab toggle, input, modal, and drawer.
  - Update `docs/FEATURE_MAP.md` in the same task whenever a route, drawer, modal, API endpoint, or `data-testid` is added or changed.

## 2. Atomic Modular Changes & Hard Architectural Boundaries
- **350-Line Cap (`max-lines: 350`):** Never create a file exceeding 350 lines (excluding blank lines and comments). Keep edits modular and cleanly scoped rather than monolithic rewrites. When touching a grandfathered legacy file over 350 lines, extract new subcomponents or hooks into dedicated modules instead of growing the file.
- **Feature Co-Location & Barrel Isolation (`features/<slug>/index.ts`):**
  - Self-contained features live under `features/<feature-name>/` with an explicit public `index.ts` barrel.
  - Features may import from `shared/`, `lib/`, or `services/`, and may ONLY import sibling features through their public `@/features/<sibling>` barrel—never deep internal paths (`@/features/<sibling>/*`).
- **Data-Layer Isolation:**
  - UI components (`components/**`, `features/**/components/**`, and client `app/**/page.tsx`) MUST NEVER directly import `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`.
  - Route all database queries and mutations through `services/**`, Server Actions, or `/api/*` endpoints, and place shared DTO interfaces in `lib/` or `features/<slug>/types.ts`.
- **Clean Engineering Comments Only:**
  - Never write narrated prompt-history comments (e.g., `// As requested by the user`, `// Round 3 fix`, `// Changed X to Y`). Use JSDoc (`/** ... */`) or concise algorithmic explanations only where non-obvious math, layout, or domain logic warrants it.
- **No Raw `useEffect` Fetch Chains in New Features:**
  - Avoid raw `useEffect(() => { fetch(...) })` waterfalls in new feature components; prefer Server Components, dedicated service/data hooks, or explicit user event handlers.

## 3. Zero Dummy Data & Design System Fidelity
- Never seed fake dollar amounts, fake workouts, or placeholder user records—initialize empty user states cleanly at `0` / empty arrays.
- Preserve theme-adaptive CSS variables (`--glass-surface`, `--glass-border`, `--glass-text-primary`, `--glass-text-muted`) and the two-font hierarchy (`EB Garamond` 500 display + `Geist` 400/500 UI). Theme switching belongs exclusively in the bottom-left Sidebar Palette control.

## 4. Mandatory Two-Stage Self-Verification Gate
Never mark a UI or full-stack task complete until BOTH verification gates pass:
1. **Static & Build Gate:** Run `npm run verify:all` (`tsc --noEmit && npm run lint && npm run build`) and confirm exit code `0`.
2. **Live Browser Verification Skill (`.agent/skills/verify-ui/SKILL.md`):** Read and execute `.agent/skills/verify-ui/SKILL.md` using the Browser Subagent against `http://localhost:3000`, verifying interactive `data-testid` flows, zero React hydration/console errors, zero HTTP `4xx`/`5xx` network failures, and embedding verification screenshots in the Walkthrough Artifact.
