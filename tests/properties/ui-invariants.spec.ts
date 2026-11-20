import fc from "fast-check";
import {
  attachRuntimeMonitors,
  expect,
  test,
} from "../fixtures/isolatedBrowserFixture";

const DOMAINS = [
  "master",
  "dogs",
  "health",
  "wealth",
  "family",
  "happiness",
  "custom",
] as const;

test.describe("Chairman Dashboard v3.0 — Isolated Property-Based UI Invariants", () => {
  test("Property 1: /roadmaps rapid view/mode/domain fuzzing never crashes, orphans modals, or hangs spinners", async ({
    page,
    outboundViolations,
  }) => {
    const monitor = attachRuntimeMonitors(page, outboundViolations);
    await page.goto("/roadmaps", { waitUntil: "domcontentloaded" });

    const root = page.getByTestId("roadmap-workspace-root");
    await expect(root).toBeVisible();

    type RoadmapOp =
      | { kind: "view"; mode: "dag" | "pyramid" }
      | { kind: "backward_chain" }
      | { kind: "copilot"; mode: "dfy" | "dwy" | "diy" }
      | { kind: "domain"; domain: (typeof DOMAINS)[number] }
      | { kind: "pace"; pace: "P" | "A" | "C" | "E" };

    const opArbitrary: fc.Arbitrary<RoadmapOp> = fc.oneof(
      fc.record({ kind: fc.constant("view" as const), mode: fc.constantFrom("dag", "pyramid") }),
      fc.constant({ kind: "backward_chain" as const }),
      fc.record({
        kind: fc.constant("copilot" as const),
        mode: fc.constantFrom("dfy", "dwy", "diy"),
      }),
      fc.record({
        kind: fc.constant("domain" as const),
        domain: fc.constantFrom(...DOMAINS),
      }),
      fc.record({
        kind: fc.constant("pace" as const),
        pace: fc.constantFrom("P", "A", "C", "E"),
      })
    );

    const actionSequences = fc.sample(fc.array(opArbitrary, { minLength: 24, maxLength: 30 }), {
      seed: 20261120,
      numRuns: 2,
    });

    for (const sequence of actionSequences) {
      for (const op of sequence) {
        if (op.kind === "view") {
          await page.getByTestId(`roadmap-view-toggle-${op.mode}`).click();
          await expect(root).toHaveAttribute("data-view-mode", op.mode);
          if (op.mode === "pyramid") {
            await expect(page.getByTestId("execution-pyramid-view")).toBeVisible();
          } else {
            await expect(page.getByTestId("dag-canvas-view")).toBeVisible();
          }
        } else if (op.kind === "backward_chain") {
          const wasOpen = await page.getByTestId("roadmap-backward-chain-panel").isVisible();
          await page.getByTestId("roadmap-backward-chain-btn").click();
          await expect(page.getByTestId("roadmap-backward-chain-panel")).toBeVisible({
            visible: !wasOpen,
          });
        } else if (op.kind === "copilot") {
          await page.getByTestId(`copilot-mode-${op.mode}`).click();
          if (op.mode === "dfy") {
            await expect(page.getByTestId("copilot-goal-input")).toBeVisible();
          } else if (op.mode === "dwy") {
            await expect(page.getByTestId("copilot-dwy-launch-btn")).toBeVisible();
          } else {
            await expect(page.getByTestId("copilot-diy-open-btn")).toBeVisible();
          }
        } else if (op.kind === "domain") {
          await page.getByTestId("roadmap-domain-selector").click();
          await page.getByTestId(`roadmap-domain-option-${op.domain}`).click();
        } else if (op.kind === "pace") {
          await page.getByTestId("roadmap-audit-pace-trigger").click();
          await page.getByTestId(`roadmap-pace-btn-${op.pace}`).click();
          await page.getByTestId("roadmap-audit-pace-trigger").click();
        }

        const dialogCount = await page.locator('[role="dialog"]').count();
        expect(dialogCount).toBeLessThanOrEqual(1);
        await expect(root).not.toHaveAttribute("data-async-phase", "SYNTHESIZING_DAG");
        monitor.assertHealthy();
      }
    }
  });

  test("Property 2: PARDO & FMEA Dossier Drawer always renders valid metadata and closes cleanly across DAG & Pyramid nodes", async ({
    page,
    outboundViolations,
  }) => {
    const monitor = attachRuntimeMonitors(page, outboundViolations);
    await page.goto("/roadmaps", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("roadmap-workspace-root")).toBeVisible();

    const stepSpecs = fc.sample(
      fc.array(
        fc.record({
          surface: fc.constantFrom("dag" as const, "pyramid" as const),
          domain: fc.constantFrom("master" as const, "health" as const, "wealth" as const),
          nodeIndexSeed: fc.integer({ min: 0, max: 12 }),
          crossSwitchViewWhileOpen: fc.boolean(),
        }),
        { minLength: 10, maxLength: 12 }
      ),
      { seed: 424242, numRuns: 1 }
    )[0];

    for (const step of stepSpecs) {
      await page.getByTestId("roadmap-domain-selector").click();
      await page.getByTestId(`roadmap-domain-option-${step.domain}`).click();
      await page.getByTestId(`roadmap-view-toggle-${step.surface}`).click();

      const candidateSelector =
        step.surface === "dag"
          ? '[data-testid^="dag-node-"]'
          : '[data-testid^="pyramid-panel-"]';

      const candidates = page.locator(candidateSelector);
      const count = await candidates.count();
      expect(count).toBeGreaterThan(0);

      const target = candidates.nth(step.nodeIndexSeed % count);
      await target.scrollIntoViewIfNeeded();
      await target.click();

      const drawer = page.getByTestId("pardo-fmea-dossier-drawer");
      await expect(drawer).toBeVisible();

      const titleText = (await page.getByTestId("pardo-fmea-dossier-title").textContent())?.trim();
      expect(titleText && titleText.length).toBeGreaterThan(0);
      await expect(drawer).toContainText("FRAGO: OPERATIONAL DIRECTIVE");
      await expect(drawer).toContainText("PACE CONTINGENCY FALLBACK PROTOCOL");

      await page.getByTestId("pardo-fmea-close-btn").click();
      await expect(drawer).toHaveCount(0);

      if (step.crossSwitchViewWhileOpen) {
        const altSurface = step.surface === "dag" ? "pyramid" : "dag";
        await page.getByTestId(`roadmap-view-toggle-${altSurface}`).click();
        await expect(page.getByTestId("roadmap-workspace-root")).toHaveAttribute(
          "data-view-mode",
          altSurface
        );
      }

      monitor.assertHealthy();
    }
  });

  test("Property 3: /calendar switching between Circadian Solar Arc and Google Calendar Grid always preserves active date state", async ({
    page,
    outboundViolations,
  }) => {
    const monitor = attachRuntimeMonitors(page, outboundViolations);
    await page.goto("/calendar", { waitUntil: "domcontentloaded" });

    const solarBtn = page.getByTestId("calendar-engine-solar");
    const googleBtn = page.getByTestId("calendar-engine-google");
    const dateBadge = page.getByTestId("calendar-active-date");

    await expect(solarBtn).toBeVisible();
    await expect(googleBtn).toBeVisible();
    await expect(dateBadge).toBeVisible();

    type CalendarOp =
      | { kind: "switch_solar" }
      | { kind: "switch_google" }
      | { kind: "step_next" }
      | { kind: "step_prev" }
      | { kind: "step_today" };

    const ops = fc.sample(
      fc.array(
        fc.constantFrom<CalendarOp>(
          { kind: "switch_google" },
          { kind: "step_next" },
          { kind: "switch_solar" },
          { kind: "switch_google" },
          { kind: "step_prev" },
          { kind: "step_today" }
        ),
        { minLength: 18, maxLength: 22 }
      ),
      { seed: 990011, numRuns: 1 }
    )[0];

    let expectedDate = await dateBadge.getAttribute("data-active-date");
    expect(expectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    for (const op of ops) {
      if (op.kind === "switch_solar") {
        const before = await dateBadge.getAttribute("data-active-date");
        await solarBtn.click();
        const after = await dateBadge.getAttribute("data-active-date");
        expect(after).toBe(before);
        expectedDate = after;
      } else if (op.kind === "switch_google") {
        const before = await dateBadge.getAttribute("data-active-date");
        await googleBtn.click();
        const after = await dateBadge.getAttribute("data-active-date");
        expect(after).toBe(before);
        expectedDate = after;
      } else {
        await googleBtn.click();
        if (op.kind === "step_next") {
          await page.getByTestId("calendar-next-btn").click();
        } else if (op.kind === "step_prev") {
          await page.getByTestId("calendar-prev-btn").click();
        } else {
          await page.getByTestId("calendar-today-btn").click();
        }
        expectedDate = await dateBadge.getAttribute("data-active-date");
        expect(expectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        await solarBtn.click();
        await expect(dateBadge).toHaveAttribute("data-active-date", expectedDate!);
      }

      monitor.assertHealthy();
    }
  });

  test("Property 4: MissionFlowNavigatorModal 6-stage state machine & Co-Pilot fuzzing preserves stage bounds and deploy guard", async ({
    page,
    outboundViolations,
  }) => {
    const monitor = attachRuntimeMonitors(page, outboundViolations);
    await page.goto("/roadmaps", { waitUntil: "domcontentloaded" });

    await page.getByTestId("global-launch-mission-flow-btn").click();
    const modal = page.getByTestId("mission-flow-modal");
    await expect(modal).toBeVisible();

    // Verify missing-title deploy guard redirects to Stage 1 cleanly
    await page.getByTestId("mission-stage-tab-4").click();
    await expect(modal).toHaveAttribute("data-active-stage", "4");
    await page.getByTestId("mission-deploy-btn").click();
    await expect(modal).toHaveAttribute("data-active-stage", "1");

    // Fuzz randomized stage tabs, Co-Pilot modes, and WBS mutations
    const stageOps = fc.sample(
      fc.array(
        fc.oneof(
          fc.record({ kind: fc.constant("stage" as const), idx: fc.integer({ min: 0, max: 5 }) }),
          fc.record({
            kind: fc.constant("mode" as const),
            mode: fc.constantFrom("dfy" as const, "dwy" as const, "diy" as const),
          }),
          fc.constant({ kind: "next" as const }),
          fc.constant({ kind: "prev" as const })
        ),
        { minLength: 18, maxLength: 24 }
      ),
      { seed: 303030, numRuns: 1 }
    )[0];

    for (const op of stageOps) {
      if (op.kind === "stage") {
        await page.getByTestId(`mission-stage-tab-${op.idx}`).click();
        await expect(modal).toHaveAttribute("data-active-stage", String(op.idx));
        await expect(page.getByTestId(`mission-stage-panel-${op.idx}`)).toBeVisible();
      } else if (op.kind === "mode") {
        await page.getByTestId(`mission-mode-${op.mode}`).click();
      } else if (op.kind === "next") {
        const cur = Number(await modal.getAttribute("data-active-stage"));
        if (cur < 5) {
          await page.getByTestId("mission-next-stage-btn").click();
          await expect(modal).toHaveAttribute("data-active-stage", String(cur + 1));
        }
      } else {
        const cur = Number(await modal.getAttribute("data-active-stage"));
        if (cur > 0) {
          await page.getByTestId("mission-prev-stage-btn").click();
          await expect(modal).toHaveAttribute("data-active-stage", String(cur - 1));
        }
      }
      monitor.assertHealthy();
    }

    // Run DFY synthesis + isolated deploy to Stage 5
    await page.getByTestId("mission-mode-dfy").click();
    await page.getByTestId("mission-dfy-input").fill("Cut to 155 lbs @ 8% BF");
    await page.getByTestId("mission-dfy-run-btn").click();
    await expect(modal).toHaveAttribute("data-active-stage", "1");

    await page.getByTestId("mission-stage-tab-4").click();
    await page.getByTestId("mission-deploy-btn").click();
    await expect(modal).toHaveAttribute("data-active-stage", "5");
    await expect(page.getByTestId("mission-stage-panel-5")).toBeVisible();

    await page.getByTestId("mission-close-btn").click();
    await expect(modal).toHaveCount(0);
    monitor.assertHealthy();
  });
});
