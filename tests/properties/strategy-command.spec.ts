import {
  attachRuntimeMonitors,
  expect,
  test,
} from "../fixtures/isolatedBrowserFixture";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
] as const;

test.describe("Operations & Strategy (/command) — Two-Layer DOM & Live Mutation Audit (CD-204)", () => {
  for (const vp of VIEWPORTS) {
    test(`Bounding-box non-occlusion, uniform card geometry & non-AI silhouettes on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
      outboundViolations,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const monitor = attachRuntimeMonitors(page, outboundViolations);

      await page.goto("/command", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("strategy-command-root")).toBeVisible();

      const chatWidget = page.getByTestId("strategy-ai-chat-widget");
      const alertsGrid = page.getByTestId("strategy-telemetry-alerts-grid");
      const caloricCard = page.getByTestId("strategy-card-caloric-drift");
      const neatCard = page.getByTestId("strategy-card-neat-slippage");
      const domainGrid = page.getByTestId("strategy-domain-grid");

      await expect(chatWidget).toBeVisible();
      await expect(caloricCard).toBeVisible();
      await expect(neatCard).toBeVisible();
      await expect(domainGrid).toBeVisible();

      // Layer 1: Non-occlusion bounding-box checks
      const chatBox = await chatWidget.boundingBox();
      const alertsBox = await alertsGrid.boundingBox();
      const calBox = await caloricCard.boundingBox();
      const neatBox = await neatCard.boundingBox();
      const domainBox = await domainGrid.boundingBox();

      expect(chatBox).not.toBeNull();
      expect(alertsBox).not.toBeNull();
      expect(calBox).not.toBeNull();
      expect(neatBox).not.toBeNull();
      expect(domainBox).not.toBeNull();

      if (chatBox && alertsBox && calBox && neatBox && domainBox) {
        // Top AI chat widget must never overlap telemetry cards below
        expect(chatBox.y + chatBox.height).toBeLessThanOrEqual(alertsBox.y + 2);
        // Drift & NEAT boxes must sit side-by-side with matching height
        expect(Math.abs(calBox.height - neatBox.height)).toBeLessThanOrEqual(4);
        expect(alertsBox.y + alertsBox.height).toBeLessThanOrEqual(domainBox.y + 36);
      }

      // Layer 2: Uniform Executive Domain Scorecards + non-AI SVG silhouettes + charts
      const domains = ["health", "wealth", "relationships", "happiness"] as const;
      const domainHeights: number[] = [];
      for (const d of domains) {
        const card = page.getByTestId(`strategy-domain-card-${d}`);
        await expect(card).toBeVisible();
        await expect(page.getByTestId(`strategy-silhouette-${d}`)).toBeVisible();
        await expect(page.getByTestId(`strategy-chart-domain-${d}`)).toBeVisible();
        const box = await card.boundingBox();
        expect(box).not.toBeNull();
        if (box) domainHeights.push(box.height);
      }

      const maxH = Math.max(...domainHeights);
      const minH = Math.min(...domainHeights);
      expect(maxH - minH).toBeLessThanOrEqual(4);

      // Verify zero horizontal page overflow
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflowPx).toBeLessThanOrEqual(1);

      monitor.assertHealthy();
    });
  }

  test("Live AI Chat state mutation updates Caloric Drift & NEAT Slippage cards within < 1500ms", async ({
    page,
    outboundViolations,
  }) => {
    const monitor = attachRuntimeMonitors(page, outboundViolations);
    await page.goto("/command", { waitUntil: "domcontentloaded" });

    const caloricCard = page.getByTestId("strategy-card-caloric-drift");
    const neatCard = page.getByTestId("strategy-card-neat-slippage");
    await expect(caloricCard).toContainText("1,920 kcal · 162g P");
    await expect(neatCard).toContainText("8,450");

    const startMs = Date.now();
    await page
      .getByTestId("strategy-ai-chat-input")
      .fill("Log 1650 kcal and 188g protein and 11400 steps today");
    await page.getByTestId("strategy-ai-chat-submit").click();

    await expect(page.getByTestId("strategy-ai-chat-receipt")).toBeVisible();
    await expect(caloricCard).toContainText("1,650 kcal · 188g P");
    await expect(caloricCard).toContainText("ON TARGET");
    await expect(neatCard).toContainText("11,400");
    await expect(neatCard).toContainText("ON PACE");

    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeLessThan(1500);

    monitor.assertHealthy();
  });
});
