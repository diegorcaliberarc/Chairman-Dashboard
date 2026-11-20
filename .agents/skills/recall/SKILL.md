---
name: recall
description: Transcript-mining and friction-to-guardrail promotion skill. Activate whenever repeated human interventions, user corrections, git reverts, or recurring bugs occur to mine session logs and commit history, classify Feedforward vs. Feedback root causes, promote permanent AST/schema/test guardrails, and verify skill updates via an independent Judge Rubric.
---

# `recall` — Transcript-Mining & Guardrail Promotion Skill

Use this skill whenever the user interrupts, redirects, or corrects an agent more than once for a similar issue, or after resolving a recurring bug or revert commit. Never patch recurring friction with one-off prose notes—convert it into deterministic code-level guardrails.

---

## 4-Step Workflow

### Step 1 — Extract Friction Patterns
Mine both recent session logs and repository commit history to isolate every point where human intervention was required:
1. **Session Transcripts:** Inspect `<appDataDir>/brain/<conversation-id>/.system_generated/logs/transcript.jsonl` for user corrections, tool-error loops, or repeated retries.
2. **Git History:** Run:
   ```bash
   git log --grep="fix\|revert\|hotfix" -n 20 --oneline
   ```
3. Record each distinct friction event with: (a) trigger symptom, (b) affected files/routes, and (c) recurrence count.

### Step 2 — Classify Root Cause (Feedforward vs. Feedback)
Categorize every extracted friction pattern into exactly one primary failure class:

| Failure Class | Definition | Canonical Remediation Target |
| :--- | :--- | :--- |
| **Feedforward Failure** | Agent lacked upfront navigation, contract, or boundary context before writing code. | `AGENTS.md`, `.agents/rules/engineering-standards.md`, `docs/FEATURE_MAP.md`, or `docs/TECH_DEBT_QUEUE.md` |
| **Feedback Failure** | Agent wrote code that violated an invariant, but no deterministic gate caught it before human review. | `eslint.config.mjs` custom AST rule, Pydantic `extra="forbid"` schema, Vitest state-machine invariant (`tests/unit/`), or Playwright property spec (`tests/properties/`) |

### Step 3 — Promote to Hard Guardrail
Draft and apply the smallest deterministic guardrail that eliminates the failure class permanently:
- **Repeated lint/anti-pattern slip:** Add or tighten an AST rule in `eslint.config.mjs` with a self-teaching remediation message.
- **Repeated UI state/layout regression:** Add a behavioral invariant to `tests/properties/ui-invariants.spec.ts` (and update `docs/FEATURE_MAP.md` `data-testid` selectors).
- **Repeated mock/schema drift:** Add a compile-time typed builder in `tests/fixtures/apiContractMocks.ts` and a contract parity assertion in `tests/unit/state-machines.spec.ts`.
- **Systemic legacy debt discovered out of scope:** Log it cleanly in `docs/TECH_DEBT_QUEUE.md` instead of opening scattered micro-PRs.

### Step 4 — Verify via Independent Judge Rubric
Before finalizing any new or modified skill in `.agents/skills/**` or rule in `.agents/rules/**`, evaluate it against this mandatory 4-point rubric:

| Judge Criterion | Pass Condition | Verification Command |
| :--- | :--- | :--- |
| **1. Operational Clarity** | Unambiguous YAML `name` + `description` trigger, concrete step-by-step commands, zero vague prose. | Manual diff inspection |
| **2. Zenity Security Hygiene** | `0` credential exfiltration patterns, `0` wildcard CORS leaks, `<24 KB` rule size cap, canonical `.agents/` root only. | `npm run audit:skills` (`exit 0`, `0` findings) |
| **3. Non-Tautological Coverage** | Accompanying unit/property tests assert real state transitions, forbidden-state rejections (`INV-*`), HTTP `422`/`403`/`409` errors, or DOM visibility—never self-mirroring tautologies. | `npm run lint` (`chairman/no-tautological-tests` `0` errors) + `npm run test:unit` |
| **4. Full Pipeline Green** | Complete 7-stage verification gate exits `0` with zero new warnings. | `npm run verify:all:json` (`ok: true`) |
