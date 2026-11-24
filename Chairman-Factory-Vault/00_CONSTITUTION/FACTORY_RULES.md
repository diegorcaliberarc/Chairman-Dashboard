# Autonomous Software Factory — Canonical Rules (`FACTORY_RULES.md` v3.4)

> **Authority:** Canonical Engineering & Governance Constitution for **EquipSyncs** (Next.js + FastAPI + Supabase RLS + Stripe) and **Terminus / Chairman Dashboard** (`app/pms/`).  
> **Companion Contracts:** Workspace `AGENTS.md`, `.agents/rules/engineering-standards.md`, `18_HARNESS_PRIMITIVES.md`, and `BOOT_SEQUENCE.md`.  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

---

## 1. Architecture, File Cap & Domain Encapsulation (`P-08`)

- **Strict 350-Line File Cap (`max-lines: 350`):** Hard error on all new files, `features/**`, `shared/**`, and `services/**` (`skipBlankLines: true`, `skipComments: true`). Extract cohesive hooks, reducers, or math helpers before approaching 350 lines. Never grow legacy files on `LEGACY_OVERSIZED_ALLOWLIST`; remove split files from the allowlist in the same PR.
- **Co-Located Domain Barrels:** Operate strictly within assigned barrels (`Staff/Billing`, `Fleet/Logistics`, `Portal/Auth`, `Terminus/PMS`, and `@features/<slug>` public `index.ts` exports). Cross-domain deep internal imports (`@features/<sibling>/*`) are strictly forbidden.
- **UI Data-Layer Isolation:** Client components and pages MUST NEVER import `@prisma/client`, `@/lib/prisma`, `@/lib/livingOsDb`, `@supabase/supabase-js`, or `@/app/api/**`.
- **Zero Foot-Gun APIs:** No raw `useEffect(() => fetch(...))` chains and no unmanaged `setTimeout` / `setInterval` / `requestAnimationFrame` inside `features/**`, `shared/**`, or `services/**`.
- **Deterministic State Machines:** Model multi-state UI views, drawers, modals, and RBAC/consent lifecycles as explicit TypeScript/Python state machines rather than ad-hoc boolean flags.

---

## 2. Multi-Tenant RLS Isolation & 7-Role RBAC Matrix (`P-05`)

- **EquipSyncs Isolation:** Every SQL query, ORM call, and API endpoint MUST enforce strict `org_id` Row-Level Security (RLS) tenant binding.
- **Terminus / Chairman Dashboard Isolation:** Every query and mutation in `app/pms/` and Personal OS routes MUST enforce strict `auth.uid()` (user-scoped) RLS isolation.
- **7-Role RBAC Matrix (Least Privilege — Never Escalate Beyond `affected_role`):**

| Code | Role | Permitted Scope |
| :--- | :--- | :--- |
| `DEV` | Platform Engineer / Factory Agent | Codebase, staging tests, non-prod migrations (never live prod tenant mutations) |
| `ADM` | System / Organization Admin | Org-wide configuration, RBAC management, audit logs within `org_id` |
| `OWN` | Business / Account Owner | Billing, Stripe subscriptions, full tenant ownership within `org_id` / `auth.uid()` |
| `STF` | Operations Staff | Dispatch, scheduling, PMS tasks, non-destructive operational CRUD within `org_id` |
| `DRV` | Fleet Driver | Assigned routes, vehicle checklists, time/delivery telemetry within `org_id` |
| `MCH` | Fleet Mechanic | Maintenance logs, work orders, asset health records within `org_id` |
| `CLI` | External Client / Portal User | Read/submit scoped portal requests strictly bound to own `org_id` & client record |

---

## 3. Code Quality, Anti-Tautology & Zero Escape Hatches (`P-15`, `P-16`)

- **Zero Hardcoded Mock Arrays:** Production views, API routes, and services MUST NEVER ship hardcoded mock arrays, fake telemetry, or stubbed placeholder records.
- **Zero Suppression Escape Hatches:** `eslint-disable*`, `@ts-ignore`, `@ts-nocheck`, and Python `# type: ignore` are banned repo-wide (`noInlineConfig: true` + `chairman/no-suppression-escapes`).
- **Anti-Tautology Test Enforcement (`chairman/no-tautological-tests`):** Every test must assert real state transitions, forbidden-state rejections (`INV-*`), HTTP `422`/`403`/`409` schema validation failures, or DOM contracts—never `expect(x).toBe(x)`.
- **Strict DTO & Build Contracts:** Keep `typescript.ignoreBuildErrors: false` in `next.config.mjs` and `ConfigDict(extra="forbid")` on inbound FastAPI Pydantic v2 mutation DTOs.

---

## 4. Scope Freeze, Safety & Execution Discipline (`P-04`, `P-07`, `P-16`)

- **v1.0 Scope Freeze:** Execute only atomic tickets in `03_AGENT_QUEUE/01_READY/` (`slack: 0`, `status: ready`). Route all unrequested v2.0 features or speculative refactors to the Icebox (`docs/TECH_DEBT_QUEUE.md`).
- **Zero Cosmetic Polish Before Binary `dod_gates` Pass:** Do not spend cycles on animations, micro-styling, or visual polish until functional, schema, security, and typecheck `dod_gates` evaluate `VERIFIED`.
- **Ruin-Threshold & Spend Isolation (`P-04`):** Any mutation with `> 0.1%` ruin probability triggers an immediate `HARD STOP` (`Status = BLOCKED`). Zero auto-sent emails, zero live production tenant DB mutations, and zero live external API calls (`Supabase`, `Stripe`, `Plaid`, `LLM`) inside test runners.
- **Risk Classification:** Every multi-file plan MUST declare **Two-Way Door (Reversible)** or **One-Way Door (Irreversible / High-Risk: Prisma schema, Supabase RLS/RBAC, auth, Plaid/Stripe billing)**; One-Way Doors require `state-chart` proof, rollback SQL, and explicit human sign-off.

---

## 5. Mandatory Verification Chain (`P-15`, `P-18`)

1. **Gate 1 (CLI 7-Stage):** `npm run verify:all:json` (`typecheck`, `lint:strict`, `lint`, `audit:skills`, `test:unit`, `pytest`, `next build`) -> `ok: true` (`exit 0`).
2. **Gate 2 (Isolated Property Fuzzing):** `npm run test:properties` -> `exit 0` (`0` outbound prod calls).
3. **Gate 3 (Live Browser Proof):** Two-layer Playwright DOM/style audit + `.agents/skills/verify-ui/SKILL.md` walkthrough (`0` console errors, `0` HTTP `4xx`/`5xx`).
4. **Post-Mortem Vaccine (`P-18`):** Every bug or incident closeout MUST add a regression test and append a 3-line `[TICKET_ID] Issue / Fix / Rule` entry to `Chairman-Factory-Vault/04_AAR_VAULT/LESSONS_LEARNED.md`.
