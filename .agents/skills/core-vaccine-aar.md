---
name: core-vaccine-aar
description: Layer 5 Post-Mortem Vaccine & Regression Rule Generator skill enforcing Harness Primitive P-18 (3-line AAR entries in 04_AAR_VAULT/LESSONS_LEARNED.md, regression tests, and schema backports) bound to FACTORY_RULES.md.
---

# Core Vaccine AAR (`P-18`)

> **Constitution Binding:** `Chairman-Factory-Vault/00_CONSTITUTION/FACTORY_RULES.md` + `18_HARNESS_PRIMITIVES.md`  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

## Purpose

Convert every bug, gate rejection, or production/staging incident into a permanent regression guardrail and institutional lesson so the Autonomous Software Factory never repeats the same failure mode.

## Primitive Rules & Execution Protocol

### 1. `[P-18]` Post-Mortem Vaccine & Regression Rule Generator
- On every bug fix, red-team rejection, or incident closeout, execute all 3 mandatory vaccine steps before transitioning the ticket to `Chairman-Factory-Vault/03_AGENT_QUEUE/04_DONE/`:
  1. **Regression Assertion:** Add a deterministic, non-tautological regression test (`Vitest`, `pytest`, or `Playwright`) that fails without the fix and passes with it.
  2. **3-Line AAR Entry:** Append an exact 3-line entry to `Chairman-Factory-Vault/04_AAR_VAULT/LESSONS_LEARNED.md`:
     ```markdown
     [TICKET_ID] Issue: <root cause and violated primitive or contract>
     [TICKET_ID] Fix: <exact code, schema, or guardrail change applied>
     [TICKET_ID] Rule: <permanent preventive rule enforced on future runs>
     ```
  3. **Schema & Map Backport:** Backport any approved table, column, or route changes to `Chairman-Factory-Vault/01_SCHEMAS/` (`equipsyncs-schema.md` or `chairman-os-schema.md`), update `SYSTEM_MAP.md` (and `docs/FEATURE_MAP.md` when UI routes/controls change), and promote structural guardrails when repeated friction occurs (via `.agents/skills/recall/SKILL.md`).

- **Binary Predicate:** `VERIFIED` iff regression test passes AND the 3-line AAR entry is committed to `Chairman-Factory-Vault/04_AAR_VAULT/LESSONS_LEARNED.md` AND all schema/map backports are synchronized.

## Closeout Verification Checklist

- [ ] Non-tautological regression test added and verified passing (`exit 0`).
- [ ] Exact 3-line `[TICKET_ID] Issue / Fix / Rule` entry appended to `04_AAR_VAULT/LESSONS_LEARNED.md`.
- [ ] `01_SCHEMAS/` and `SYSTEM_MAP.md` / `docs/FEATURE_MAP.md` updated with zero drift.
- [ ] Ticket moved to `03_AGENT_QUEUE/04_DONE/` with final lossless `[BATON_PACKET]`.
