---
name: workflow-audit
description: Real-world persona and Jobs-to-be-Done (JTBD) end-to-end workflow benchmarking skill and reusable `workflow-auditor` subagent specification. Activate whenever the user asks to audit whether pages feel half-built, benchmark app workflows against real power-user tools online, detect hardcoded placeholder data or dead-end buttons, or compile an app-wide workflow completeness and blocker report.
---

# `workflow-audit` — Real-World Persona & JTBD Workflow Benchmarking Skill

Use this skill to move beyond "does the page render HTTP 200?" checks and verify whether a real power user can actually complete their end-to-end job across Chairman Dashboard without hitting placeholder data, dead buttons, unpersisted state, or disconnected modules.

---

## 4-Step Execution Procedure

### Step 1 — Run the Deterministic Static Placeholder & Persistence Scanner
Execute the bundled scanner across all App Router pages and API handlers:
```bash
node .agents/skills/workflow-audit/scripts/scan-placeholders.mjs --json
```
This flags for every route:
- Real `/api/*` `GET` / `POST` / `PATCH` / `DELETE` wiring vs. local-only `useState` / `localStorage`
- Backing API database persistence (`prisma` / `pgQuery` / `pgExec`) vs. static/in-memory stubs
- Hardcoded `MOCK_` / `SEED_` / `SAMPLE_` / `DEFAULT_` arrays, `"coming soon"` copy, `TODO` markers, and no-op `onClick={() => {}}` handlers.

### Step 2 — Benchmark Against Real Power-User Workflows Online
Read [domain-benchmarks.md](./references/domain-benchmarks.md) for the target route(s) and use `search_web` to verify current power-user workflows for each domain category (e.g., ClickUp/Linear sprint execution, Hevy/Strong progressive overload logging, MacroFactor/Cronometer nutrition logging, TradeZella trade journaling, Monarch/YNAB cashflow & budget tracking, Sunsama/Motion time-blocking).

### Step 3 — Invoke the `workflow-auditor` Subagent (Single Route or Parallel Sphere Fan-Out)
Define and invoke the reusable `workflow-auditor` subagent (`define_subagent` + `invoke_subagent`) using the specification below. For live interactive verification, pair with the `browser` subagent against `http://localhost:3000` (testing **Create → Edit → Persist → Refresh → Cross-Module Handoff**).

### Step 4 — Compile `docs/WORKFLOW_AUDIT_REPORT.md` & Sync Tech Debt
Write/update `docs/WORKFLOW_AUDIT_REPORT.md` with:
1. Executive Summary & Overall App Completeness Score (`0–100%`)
2. Full 19-Module Workflow Completeness Matrix (ranked from most blocked to most complete)
3. Per-Module Blocker Breakdown (`WORKS` / `PARTIAL` / `BLOCKED` steps, exact file/line causes, and required UI/API fixes)
4. Prioritized Remediation Roadmap grouped by Life Sphere (`Operations`, `Health`, `Wealth`, `Family`, `Infrastructure`).

Log any out-of-scope structural smells discovered during the audit in `docs/TECH_DEBT_QUEUE.md`.

---

## Reusable `workflow-auditor` Subagent Specification

When invoking a dedicated auditor subagent via `define_subagent`:
- **Name:** `workflow-auditor`
- **Description:** Audits Chairman Dashboard routes against real-world power-user workflows, inspecting UI pages, API handlers, and persistence layers to score workflow completeness (0–100%) and isolate exact blockers.
- **EnableWriteTools:** `false` (read-only research/audit; parent agent writes `docs/WORKFLOW_AUDIT_REPORT.md` and applies fixes).
- **SystemPrompt:**
  > You are the Chairman Dashboard Workflow Auditor. For every assigned route, compare the actual implementation in `app/<route>/page.tsx`, `features/**`, `components/**`, and `app/api/**` against real-world power-user Jobs-to-be-Done benchmarks in `.agents/skills/workflow-audit/references/domain-benchmarks.md`. Never rubber-stamp a page just because it renders. Verify: (1) Can a user create, edit, and delete real records that survive page reload? (2) Are there hardcoded placeholder arrays, fake metrics, dead buttons, or unimplemented tabs? (3) Does data flow across connected modules (e.g., `/pms` ↔ `/calendar` ↔ `/command` ↔ `/kpis`)? Output a crisp `0–100%` completeness score, a step-by-step `WORKS / PARTIAL / BLOCKED` table, and exact file-level blockers.

---

## Verification Checklist
- Run `npm run audit:skills` after any edit to this skill (`0` Zenity findings).
- Never mutate production databases during live workflow audits—use isolated mocks or clean up any test records created on localhost.
