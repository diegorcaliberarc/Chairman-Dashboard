import { expect, Page, test } from "@playwright/test";
import fc from "fast-check";

const DOMAINS = [
  "master",
  "dogs",
  "health",
  "wealth",
  "family",
  "happiness",
  "custom",
] as const;

function attachRuntimeMonitors(page: Page) {
  const uncaughtErrors: string[] = [];
  const consoleErrors: string[] = [];
  const isOfflineCiDb = (process.env.DATABASE_URL || "").includes("chairman_ci");

  page.on("pageerror", (err) => {
    uncaughtErrors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      isOfflineCiDb &&
      (text.includes("Failed to load resource") ||
        text.includes("Failed to fetch all calendar events") ||
        text.includes("CLIENT_FETCH_ERROR"))
    ) {
      return;
    }
    consoleErrors.push(text);
  });

  return {
    assertHealthy: () => {
      expect(uncaughtErrors, `Uncaught page exceptions: ${uncaughtErrors.join(" | ")}`).toEqual(
        []
      );
      expect(
        consoleErrors,
        `Console/hydration errors: ${consoleErrors.join(" | ")}`
      ).toEqual([]);
    },
  };
}

test.describe("Chairman Dashboard v2 — Property-Based UI Invariants", () => {
  test("Property 1: /roadmaps rapid view/mode/domain fuzzing never crashes, orphans modals, or hangs spinners", async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitors(page);
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

    const actionSequences = fc.sample(fc.array(opArbitrary, { minLength: 26, maxLength: 32 }), {
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
  }) => {
    const monitor = attachRuntimeMonitors(page);
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
  }) => {
    const monitor = attachRuntimeMonitors(page);
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
});
