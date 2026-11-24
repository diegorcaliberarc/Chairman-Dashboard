# Autonomous Software Factory — Unified Boot Sequence (v3.4)

> **Applies To:** Every Antigravity worker, subagent, and CLI agent operating on **EquipSyncs** (Next.js + FastAPI + Supabase RLS + Stripe) and **Terminus / Chairman Dashboard** (`app/pms/`).  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

Execute Steps 1 through 4 in strict order at the start of every session before modifying any file or running any mutation.

---

## Step 1: Load Constitutional & Schema Context (`P-13`, `P-14`)

Parse the following canonical files (keep context lean; load only the target schema for the active ticket):
1. `Chairman-Factory-Vault/00_CONSTITUTION/FACTORY_RULES.md` (and workspace `AGENTS.md`).
2. `Chairman-Factory-Vault/00_CONSTITUTION/18_HARNESS_PRIMITIVES.md`.
3. Target schema in `Chairman-Factory-Vault/01_SCHEMAS/`:
   - `equipsyncs-schema.md` for EquipSyncs (`org_id` tenant isolation).
   - `chairman-os-schema.md` for Terminus / Chairman Dashboard (`auth.uid()` isolation).
4. Active ticket in `Chairman-Factory-Vault/03_AGENT_QUEUE/01_READY/` (`slack: 0`, `status: ready`).

---

## Step 2: Load Relevant Modular Skills (`P-14`)

Load only the `.agents/skills/*.md` files required for your assigned phase:
- **Intake / Triage:** `.agents/skills/core-triage-refinery.md` (`P-01`–`P-03`)
- **Safety / RLS / Pre-Mortem:** `.agents/skills/core-palantir-guard.md` (`P-04`–`P-06`)
- **Execution / Handoff / Watchdog:** `.agents/skills/core-baton-handoff.md` (`P-07`–`P-12`, `P-14`)
- **Verification / Red-Team / Quarantine:** `.agents/skills/core-oracle-proof.md` (`P-13`, `P-15`–`P-17`)
- **Incident Closeout / AAR Vaccine:** `.agents/skills/core-vaccine-aar.md` (`P-18`)

---

## Step 3: Emit Mandatory Read-Back Gate (`P-10`)

Before creating, editing, or deleting any file, your **first output line** MUST be a 1-sentence Read-Back confirming:
- `Task ID`
- `org_id` (or `PERSONAL_OS`) / target project
- `affected_role` (`DEV` | `ADM` | `OWN` | `STF` | `DRV` | `MCH` | `CLI`)
- Exact binary `dod_gates`

If any field is missing, null, or contradicts the ticket frontmatter, halt immediately (`NOT VERIFIED`).

---

## Step 4: Enforce Non-Negotiable Runtime Invariants (`P-04`, `P-05`, `P-08`, `P-15`, `P-16`)

1. **350-Line Cap (`P-08`):** Every modified or created file MUST remain `<= 350` lines with zero illegal cross-domain imports outside its assigned barrel (`Staff/Billing`, `Fleet/Logistics`, `Portal/Auth`, `Terminus/PMS`, `@features/<slug>`).
2. **Zero Hardcoded Mock Arrays (`P-16`):** Reject hardcoded mock arrays, dummy placeholder data, suppression escape hatches (`eslint-disable*`, `@ts-ignore`, `@ts-nocheck`, `# type: ignore`), and premature cosmetic styling before core binary DoD gates pass.
3. **Strict Tenant & RBAC Isolation (`P-05`):** Every EquipSyncs query binds `org_id`; every Terminus/Chairman Dashboard query binds `auth.uid()`; never exceed the 7-role RBAC scope.
4. **Ruin-Threshold Circuit Breaker (`P-04`):** Ruin probability `> 0.1%` triggers an immediate HARD STOP (`Status = BLOCKED`). Zero auto-sent emails; zero live production tenant mutations.
5. **Binary Verification (`P-15`):** `INCONCLUSIVE === FAIL`. Do not promote from `02_PENDING_REVIEW/` to `03_VERIFIED/` without all 3 empirical proofs (`tsc --noEmit` + lint + `pytest`/`vitest`, `01_SCHEMAS/` state verification, and two-layer Playwright DOM/browser walkthrough).
6. **Lossless Handoff & Watchdog (`P-09`, `P-12`, `P-18`):** Halt and log `status: blocked` after 2 non-advancing attempts; end every run with a lossless `[BATON_PACKET]`; append a 3-line AAR entry (`[TICKET_ID] Issue / Fix / Rule`) to `04_AAR_VAULT/LESSONS_LEARNED.md` on every bug/incident closeout.
