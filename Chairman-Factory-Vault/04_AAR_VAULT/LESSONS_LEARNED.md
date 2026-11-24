# After-Action Review (AAR) Vault — Lessons Learned (`P-18`)

> **Governance Contract:** Bound to `Chairman-Factory-Vault/00_CONSTITUTION/18_HARNESS_PRIMITIVES.md` (`P-18`) and `.agents/skills/core-vaccine-aar.md`.  
> **Mandatory Closeout Format:** Every resolved bug, red-team rejection, or incident MUST append an exact 3-line entry below (plus a non-tautological regression test) before moving a ticket to `03_AGENT_QUEUE/04_DONE/`:
>
> ```text
> [TICKET_ID] Issue: <root cause and violated primitive or contract>
> [TICKET_ID] Fix: <exact code, schema, or guardrail change applied>
> [TICKET_ID] Rule: <permanent preventive rule enforced on future runs>
> ```

---

## Constitutional Baseline & Incident Log

[HARNESS-V3.4-ACTIVATION] Issue: Initial v3.4 harness merge left `FACTORY_RULES.md`, `01_SCHEMAS/chairman-os-schema.md`, and `04_AAR_VAULT/LESSONS_LEARNED.md` unseeded, and `scripts/audit-skills-and-mcp.mjs` only scanned `.agents/skills/**/SKILL.md`, excluding flat `.agents/skills/core-*.md` files from CI Zenity audits.
[HARNESS-V3.4-ACTIVATION] Fix: Seeded `FACTORY_RULES.md` from canonical repo standards, generated ground-truth `chairman-os-schema.md` directly from Prisma/Supabase/FastAPI/Next.js sources, initialized `LESSONS_LEARNED.md`, and extended `scripts/audit-skills-and-mcp.mjs` to scan `.agents/skills/core-*.md`.
[HARNESS-V3.4-ACTIVATION] Rule: Never declare a harness activation complete until every referenced constitutional file, ground-truth schema baseline, and CI audit glob is verified live with `exit 0` (`INCONCLUSIVE === FAIL`).

[LINT-ZERO-WARNINGS] Issue: Repository carried 150 ESLint warnings (7 react-hooks/exhaustive-deps, 1 @next/next/no-page-custom-font, 73 no-restricted-syntax timer/useEffect(fetch) warnings, and 69 grandfathered max-lines files on LEGACY_OVERSIZED_ALLOWLIST).
[LINT-ZERO-WARNINGS] Fix: Eliminated all 7 hook dependency warnings, moved Google Fonts import to app/globals.css, split SundayReviewWizardModal.tsx below 350 lines (removing it from LEGACY_OVERSIZED_ALLOWLIST), encapsulated timers in lib/hooks/useTimers.ts and UI fetches in services/uiClientService.ts, and ratcheted --max-warnings from 151 to 123.
[LINT-ZERO-WARNINGS] Rule: Use lib/hooks/useTimers.ts for declarative timers and services/*ClientService.ts for UI fetches; always ratchet --max-warnings down in package.json after every cleanup batch and track remaining LEGACY_OVERSIZED_ALLOWLIST splits as atomic domain-barrel tickets.
