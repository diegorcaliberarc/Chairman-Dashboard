---
name: verify-ui
description: >-
  Autonomous Proof-of-Work UI verification workflow using Antigravity's native Browser Subagent
  against http://localhost:3000. Activate whenever routes, UI components, drawers, modals, styles,
  or interactive API contracts are added or modified to verify data-testid flows, console health,
  network responses, and visual rendering into walkthrough.md.
---

# Verify UI — Chin & Chin Proof-of-Work Browser Verification Loop (v3.0)

Close the runtime feedback loop directly in Chrome via the `browser` subagent and produce an auditable **Proof-of-Work Evidence Chain** in `walkthrough.md`.

## Prerequisites & Guardrails
1. Run `npm run verify:all:json` (`scripts/verify-all.mjs --json`) and `npm run test:properties` (isolated port `3100`, zero live DB/LLM calls) first—both MUST exit `0`.
2. Never use `curl`, `wget`, or shell scraping on UI pages as a substitute for the `browser` subagent.

## Step 1: Ensure Local Next.js Server is Running on Port 3000
1. Check active tasks via `manage_task` (`Action: "list"`).
2. If port `3000` is free (check via [ensure-dev-server.ps1](./scripts/ensure-dev-server.ps1) if needed), start `npm run start` (if `.next` was just built) or `npm run dev` with `IsDaemon: true` and `WaitMsBeforeAsync: 5000`.

## Step 2: Consult `docs/FEATURE_MAP.md`
Retrieve the target route URL and deterministic `[data-testid="..."]` + ARIA selectors from `docs/FEATURE_MAP.md`.

## Step 3: Spawn the `browser` Subagent with a Deterministic Test Plan
Call `invoke_subagent` with `TypeName: "browser"` and a task-specific `Role`. Instruct the subagent to:
1. Open `http://localhost:3000/<target-route>` in a foreground tab (avoid `background: true` throttling) and use `take_snapshot`, `click`, `fill`, `take_screenshot`, `list_console_messages`, and `list_network_requests` (do not invoke `evaluate_script`).
2. Exercise all modified `[data-testid="..."]` toggles, modals, drawers, and inputs.
3. Audit Console & Network: confirm **0** uncaught runtime exceptions, **0** React hydration mismatches, and **0** failed HTTP `4xx`/`5xx` API responses.
4. Capture full-viewport screenshots and return their exact saved file paths alongside structured console/network counts.

## Step 4: Assemble Chin & Chin Proof-of-Work Evidence Chain in `walkthrough.md`
1. Copy all verification screenshots into `<appDataDir>\brain\<conversation-id>`.
2. Embed in `walkthrough.md`:
   - Compact JSON summary from `npm run verify:all:json`.
   - Pass summary from isolated `npm run test:properties` (`0` outbound prod violations).
   - Before/After Mermaid `stateDiagram-v2` charts (when `.agents/skills/state-chart/SKILL.md` applies).
   - Browser Subagent console/network telemetry counts + embedded screenshots (`![Caption](/absolute/path/to/screenshot.png)`).
