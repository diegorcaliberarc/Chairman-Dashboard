---
name: core-baton-handoff
description: Layer 3 & 4 Decomposition, Stateless State Transfer & Runtime Control skill enforcing Harness Primitives P-07 through P-12 and P-14 bound to FACTORY_RULES.md.
---

# Core Baton Handoff (`P-07`–`P-12`, `P-14`)

> **Constitution Binding:** `Chairman-Factory-Vault/00_CONSTITUTION/FACTORY_RULES.md` + `18_HARNESS_PRIMITIVES.md`  
> **Global Predicate:** Every gate evaluates strictly as `VERIFIED` or `NOT VERIFIED` (`INCONCLUSIVE === FAIL`).

## Purpose

Coordinate atomic ticket slicing, domain isolation, mandatory read-back verification, lossless handoffs, watchdog loop protection, and lean compute governance without agent-to-agent chat loops.

## Primitive Rules & Execution Protocol

### 1. `[P-07]` Work-Breakdown Slicer
- Pull work strictly from `Chairman-Factory-Vault/03_AGENT_QUEUE/01_READY/` where `slack: 0` and `status: ready` in topological DAG order.
- Slice features into non-overlapping atomic tickets with explicit input/output contracts. Route unrequested v2.0 ideas to the Icebox.
- **Binary Predicate:** `VERIFIED` iff task DAG has zero cycles and zero overlapping file locks across parallel workers.

### 2. `[P-08]` Domain Container Encapsulation
- Work strictly inside the assigned co-located domain barrel (`Staff/Billing`, `Fleet/Logistics`, `Portal/Auth`, `Terminus/PMS`, or `@features/<slug>`).
- Enforce the strict **350-line maximum file cap** (`max-lines: 350`) and zero illegal cross-domain deep imports. Extract helper math/state machines into dedicated module files before hitting 350 lines.
- **Binary Predicate:** `VERIFIED` iff all modified files `<= 350` lines AND zero illegal cross-domain imports exist.

### 3. `[P-09]` Lossless Baton Packet Serialization
- End every worker run by emitting a complete, lossless `[BATON_PACKET]` matching the canonical schema:
  ```json
  {
    "task_id": "string",
    "next_owner_bot": "string",
    "new_status": "ready | pending_review | verified | done | blocked",
    "files_touched": ["relative/path"],
    "exact_state_summary": "verbatim state without dropping IDs or error traces",
    "blockers": []
  }
  ```
- **Binary Predicate:** `VERIFIED` iff serialized `[BATON_PACKET]` re-hydrates identically with zero truncated or missing required fields.

### 4. `[P-10]` State Checksum & Read-Back Gate
- First output line of every run MUST be a 1-sentence Read-Back confirming `Task ID`, `org_id` / `project`, `affected_role`, and binary `dod_gates` before editing any file.
- Verify post-write file and DB state matches the ticket spec and `Chairman-Factory-Vault/01_SCHEMAS/`.
- **Binary Predicate:** `VERIFIED` iff Read-Back matches ticket frontmatter AND post-write state hash matches intended spec.

### 5. `[P-11]` Stigmergy Blackboard Coordination
- Coordinate exclusively through `GEM_BOT_BOARD` and `Chairman-Factory-Vault/03_AGENT_QUEUE/` folder/status transitions (`00_TRIAGE` -> `01_READY` -> `02_PENDING_REVIEW` -> `03_VERIFIED` -> `04_DONE`). Never rely on direct agent-to-agent chat loops.
- **Binary Predicate:** `VERIFIED` iff state transition is committed atomically to the shared queue with a monotonic timestamp.

### 6. `[P-12]` Liveness Watchdog Timer
- Respect wall-clock timeouts and ticket `time_box_mins`.
- If **2 consecutive attempts** fail to advance closer to the binary `dod_gates`, immediately halt, set `status: blocked`, record the exact dependency in `blockers`, and emit `[BATON_PACKET]`.
- **Binary Predicate:** `VERIFIED` iff execution completes within `time_box_mins` OR halts cleanly with an explicit blocker log.

### 7. `[P-14]` Compute & Concurrency Governor
- Cap parallel cloud threads strictly below 15 concurrent tasks and respect rolling 5-hour compute budgets and API rate limits.
- Keep context lean: load only `FACTORY_RULES.md`, `18_HARNESS_PRIMITIVES.md`, the target file in `01_SCHEMAS/`, and the relevant `.agents/skills/*.md` files.
- **Binary Predicate:** `VERIFIED` iff active concurrency `<= max capacity` AND zero HTTP 429 / token-overflow failures occur.
