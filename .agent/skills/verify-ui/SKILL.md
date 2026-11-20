---
name: verify-ui
description: >-
  Autonomous end-to-end UI verification workflow using Antigravity's native Browser Subagent
  against http://localhost:3000. Activate whenever routes, UI components, drawers, modals, styles,
  or interactive API contracts are added or modified to verify data-testid flows, console health,
  network responses, and visual rendering before marking a task complete.
---

# Verify UI — Native Browser Subagent QA Loop

Use this skill to verify UI and full-stack changes directly in Chrome via the `browser` subagent instead of asking the user to inspect `localhost:3000` manually.

## Prerequisites & Guardrails
- Always run `npm run verify:all` (`tsc --noEmit && npm run lint && npm run build`) first so static type and boundary errors are resolved before launching the browser.
- Never use `curl`, `wget`, or shell scraping on UI pages as a substitute for the `browser` subagent.

## Step 1: Ensure Next.js Dev Server is Running on Port 3000
1. Check active background tasks via `manage_task` (`Action: "list"`).
2. If no dev server daemon is running on port `3000`, start one using `run_command`:
   - `CommandLine`: `npm run dev`
   - `IsDaemon`: `true`
   - `WaitMsBeforeAsync`: `5000`
   - *(Optional helper script)*: [ensure-dev-server.ps1](./scripts/ensure-dev-server.ps1)

## Step 2: Consult `docs/FEATURE_MAP.md`
Read `docs/FEATURE_MAP.md` to retrieve:
- The exact target route URL (e.g., `http://localhost:3000/roadmaps`).
- Deterministic `[data-testid="..."]` selectors and ARIA roles for every view toggle, tab, modal, drawer, and input on that route.

## Step 3: Spawn the `browser` Subagent with a Deterministic Test Plan
Call `invoke_subagent` with `TypeName: "browser"` and a task-specific `Role` (e.g., `"Strategic Roadmap UI Verifier"`). Your prompt MUST instruct the subagent to:

1. **Navigate & Render Check:**
   - Open `http://localhost:3000/<target-route>` and wait for network idle and primary `[data-testid="..."]` landmarks to mount.
2. **Interactive State Walkthrough (Using `data-testid`):**
   - Click through primary interactive controls documented in `docs/FEATURE_MAP.md`.
   - *Example for `/roadmaps`:*
     - Click `[data-testid="roadmap-view-toggle-pyramid"]` and verify `[data-testid="pyramid-level-1"]` through `[data-testid="pyramid-level-5"]` render; toggle back via `[data-testid="roadmap-view-toggle-dag"]`.
     - Click `[data-testid="roadmap-backward-chain-btn"]` and verify `[data-testid="roadmap-backward-chain-panel"]` appears.
     - Toggle `[data-testid="copilot-mode-dfy"]`, `[data-testid="copilot-mode-dwy"]`, and `[data-testid="copilot-mode-diy"]`, and test typing into `[data-testid="copilot-goal-input"]`.
     - Click a DAG node or Pyramid panel to verify `[data-testid="pardo-fmea-dossier-drawer"]` opens and closes cleanly via `[data-testid="pardo-fmea-close-btn"]`.
3. **Console & Network Health Audit:**
   - Inspect Chrome DevTools Console logs: confirm **zero** React hydration mismatches and **zero** uncaught runtime exceptions.
   - Inspect Network requests: confirm **zero** failed HTTP `4xx` or `5xx` API responses during page load and user interactions.
4. **Visual Evidence Capture:**
   - Capture clear full-viewport screenshots of each verified state and return their saved file paths along with a structured PASS/FAIL summary of console and network checks.

## Step 4: Attach Proof to Walkthrough Artifact
1. Copy any screenshots not already inside `<appDataDir>\brain\<conversation-id>` into that artifact directory.
2. Create or update `walkthrough.md` in the artifact directory embedding the screenshots (`![Caption](/absolute/path/to/screenshot.png)`) alongside the `npm run verify:all` exit status and console/network audit results.
