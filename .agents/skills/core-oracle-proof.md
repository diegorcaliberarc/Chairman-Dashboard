---
name: core-oracle-proof
description: Layer 4 & 5 Empirical Verification & Red-Team skill enforcing Harness Primitives P-13 (State-Drift Reconciliation), P-15 (Three-Point Consensus Verifier), P-16 (Adversarial Red-Team Diff Auditor), and P-17 (Rogue-Node Quarantine Firewall) bound to FACTORY_RULES.md.
---

# Core Oracle Proof (`P-13`, `P-15`, `P-16`, `P-17`)

> **Constitution Binding:** `Chairman-Factory-Vault/00_CONSTITUTION/FACTORY_RULES.md` + `18_HARNESS_PRIMITIVES.md`  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

## Purpose

Enforce zero schema drift, three-point empirical proof, adversarial diff auditing, and automatic rogue-worker quarantine before promoting any ticket from `02_PENDING_REVIEW/` to `03_VERIFIED/`.

## Primitive Rules & Execution Protocol

### 1. `[P-13]` State-Drift Reconciliation
- Diff all touched database tables, columns, Pydantic/Zod DTOs, and API routes against:
  - `Chairman-Factory-Vault/01_SCHEMAS/equipsyncs-schema.md`
  - `Chairman-Factory-Vault/01_SCHEMAS/chairman-os-schema.md`
- Never invent undocumented table names, columns, or endpoints. Approved schema changes MUST be backported to `01_SCHEMAS/` before ticket closeout.
- **Binary Predicate:** `VERIFIED` iff zero unreconciled schema or endpoint drift exists between code and `01_SCHEMAS/`.

### 2. `[P-15]` Three-Point Consensus Verifier
- Promoting a ticket from `03_AGENT_QUEUE/02_PENDING_REVIEW/` to `03_AGENT_QUEUE/03_VERIFIED/` requires all **3 independent empirical proof artifacts**:
  1. **Static & Unit Gate:** `tsc --noEmit`, ESLint (`npm run lint:strict` & `npm run lint`), `npm run audit:skills`, `vitest`, and `pytest` pass with exit code `0`.
  2. **Schema & State Gate:** Verified DB/API state response matching `Chairman-Factory-Vault/01_SCHEMAS/` contracts with zero schema drift.
  3. **Browser & Visual Gate:** Two-layer Playwright DOM/style bounding-box audit (`npm run test:properties`) plus live browser walkthrough screenshot/log with `0` console errors and `0` HTTP `4xx`/`5xx` responses.
- Missing or partial proof equals `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).
- **Binary Predicate:** `VERIFIED` iff all 3 proof artifacts pass with zero errors.

### 3. `[P-16]` Adversarial Red-Team Diff Auditor
- Audit every candidate diff against `FACTORY_RULES.md` and workspace `AGENTS.md`. Immediately reject diffs containing:
  - Hardcoded mock arrays or dummy placeholder data in production views/endpoints.
  - Missing `org_id` (EquipSyncs) or `auth.uid()` (Terminus/Chairman Dashboard) tenant filters.
  - RBAC privilege leaks exceeding the 7-role scope.
  - Suppression escape hatches (`eslint-disable*`, `@ts-ignore`, `@ts-nocheck`, `# type: ignore`).
  - Premature cosmetic UI styling before core functional binary DoD gates pass.
- **Binary Predicate:** `VERIFIED` iff zero critical/high security or constitution violations exist in the diff.

### 4. `[P-17]` Rogue-Node Quarantine Firewall
- Track consecutive verification rejections per worker lane on the active ticket.
- If a worker fails Red-Team (`P-16`) or Three-Point Consensus (`P-15`) **twice** on the same ticket, revoke write access, flag `QUARANTINE_WORKER` in `GEM_BOT_BOARD`, and escalate to the Chief of Staff.
- **Binary Predicate:** `VERIFIED` iff worker operates within constitutional bounds (`< 2` consecutive failures).
