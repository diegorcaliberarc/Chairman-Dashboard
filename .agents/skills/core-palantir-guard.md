---
name: core-palantir-guard
description: Layer 2 Safety, Isolation & Circuit Breakers skill enforcing Harness Primitives P-04 (Ruin-Threshold Circuit Breaker), P-05 (Multi-Tenant & Blast-Radius Firewall), and P-06 (Pre-Mortem Failure Injection) bound to FACTORY_RULES.md.
---

# Core Palantir Guard (`P-04`, `P-05`, `P-06`)

> **Constitution Binding:** `Chairman-Factory-Vault/00_CONSTITUTION/FACTORY_RULES.md` + `18_HARNESS_PRIMITIVES.md`  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

## Purpose

Prevent irreversible data loss, cross-tenant exposure, billing errors, and unhandled runtime failures before any mutation, migration, or multi-file sprint executes.

## Primitive Rules & Execution Protocol

### 1. `[P-04]` Ruin-Threshold Circuit Breaker
- Enforce hard execution timeouts, API rate counters, and external action locks:
  - **Zero** auto-sent external emails or webhooks.
  - **Zero** direct mutations against live production tenant databases.
  - **Zero** live production calls in test runners (scrub `.env` secrets; mock/block Supabase, Stripe, Plaid, and LLM endpoints).
- Compute the Ruin Scenario before any schema migration, billing change, or destructive operation. If the estimated probability of data corruption, cross-tenant exposure, or billing error exceeds `0.1%`, trigger a **HARD STOP**, open the circuit breaker, and set `Status = BLOCKED`.
- **Binary Predicate:** `VERIFIED` iff accumulated ruin risk `<= 0.1%` AND circuit breaker is `CLOSED`.

### 2. `[P-05]` Multi-Tenant & Blast-Radius Firewall
- Enforce Supabase Row-Level Security (RLS) across every query and endpoint:
  - **EquipSyncs:** Strict `org_id` tenant binding on every SELECT, INSERT, UPDATE, and DELETE.
  - **Terminus / Chairman Dashboard (`app/pms/`):** Strict `auth.uid()` isolation on every personal OS query and mutation.
- Enforce the 7-role RBAC scope (`DEV` | `ADM` | `OWN` | `STF` | `DRV` | `MCH` | `CLI`). Never generate raw SQL or API routes omitting tenant filters, and never escalate privileges beyond `affected_role`.
- **Binary Predicate:** `VERIFIED` iff AST/query inspection confirms strict tenant binding on every query AND RLS tests pass.

### 3. `[P-06]` Pre-Mortem Failure Injection
- Before starting any multi-file sprint, enumerate the **top 2 failure modes** (e.g., DB timeout, network latency spike, dropped Stripe webhook, partial write) and verify explicit graceful error-handling and rollback paths exist in the spec.
- Run staging chaos checks simulating DB timeouts, network latency, and Stripe webhook drops prior to release.
- **Binary Predicate:** `VERIFIED` iff system recovers with zero unhandled exceptions and zero silent state corruption.

## Safety Gate Checklist

- [ ] Ruin risk `<= 0.1%`, circuit breaker `CLOSED`, external action locks active (`P-04`).
- [ ] Every EquipSyncs query binds `org_id`; every Terminus/Chairman Dashboard query binds `auth.uid()`; 7-role RBAC intact (`P-05`).
- [ ] Top 2 failure modes documented with recovery paths; chaos checks pass (`P-06`).
