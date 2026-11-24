import { test as base, expect, Page, Request } from "@playwright/test";
import {
  buildAuthSessionMock,
  buildCalendarOpsMock,
  buildCircadianRadarMock,
  buildGoogleSyncMock,
  buildKpiScorecardMock,
  buildMissionFlowGetMock,
  buildMissionFlowPostMock,
  buildPmsWorkspaceMock,
  buildRoadmapsSynthesizeMock,
  buildUiPreferencesMock,
} from "./apiContractMocks";

const FORBIDDEN_EXTERNAL_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /^generativelanguage\.googleapis\.com$/i,
  /^aiplatform\.googleapis\.com$/i,
  /^api\.openai\.com$/i,
  /^api\.anthropic\.com$/i,
  /\.stripe\.com$/i,
  /\.plaid\.com$/i,
  /^www\.googleapis\.com$/i,
  /^oauth2\.googleapis\.com$/i,
];

function jsonResponse(payload: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  };
}

function safeParsePostJson(request: Request): Record<string, unknown> {
  try {
    const parsed = request.postDataJSON();
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Keiji Kanazawa Isolated Browser Fixture:
 * 1. Hard-blocks & fails the test if any request attempts outbound egress to
 *    live Supabase, Gemini/OpenAI, Stripe, Plaid, or Google OAuth/Calendar APIs.
 * 2. Serves deterministic, schema-locked mock responses (`apiContractMocks.ts`)
 *    for local `/api/*` routes so autonomous UI fuzzing never mutates live DBs
 *    or drifts from production TypeScript contracts.
 */
export const test = base.extend<{
  outboundViolations: string[];
}>({
  outboundViolations: async ({ context }, use) => {
    const violations: string[] = [];
    const strategyState = {
      caloriesEaten: 1920,
      proteinG: 162,
      kcalDeficit: 280,
      totalSteps: 8450,
    };

    await context.route("**/*", async (route) => {
      const request = route.request();
      const reqUrl = new URL(request.url());
      const host = reqUrl.hostname;

      if (FORBIDDEN_EXTERNAL_HOST_PATTERNS.some((re) => re.test(host))) {
        violations.push(`${request.method()} ${reqUrl.href}`);
        await route.abort("blockedbyclient");
        return;
      }

      if (host === "fonts.googleapis.com" || host === "fonts.gstatic.com") {
        await route.fulfill({ status: 200, contentType: "text/css", body: "" });
        return;
      }

      if (
        (host === "127.0.0.1" || host === "localhost") &&
        reqUrl.pathname.startsWith("/api/")
      ) {
        const p = reqUrl.pathname;
        if (p.startsWith("/api/auth/session")) {
          await route.fulfill(jsonResponse(buildAuthSessionMock()));
          return;
        }
        if (p === "/api/ui-preferences") {
          await route.fulfill(jsonResponse(buildUiPreferencesMock()));
          return;
        }
        if (p === "/api/calendar-events" || p === "/api/circadian") {
          await route.fulfill(jsonResponse({ events: [] }));
          return;
        }
        if (p === "/api/circadian/radar") {
          const dateParam = reqUrl.searchParams.get("date") ?? "2026-11-20";
          await route.fulfill(jsonResponse(buildCircadianRadarMock(dateParam)));
          return;
        }
        if (p === "/api/calendar-ops") {
          await route.fulfill(jsonResponse(buildCalendarOpsMock()));
          return;
        }
        if (p === "/api/calendar/google-sync") {
          await route.fulfill(jsonResponse(buildGoogleSyncMock()));
          return;
        }
        if (p === "/api/tasks") {
          await route.fulfill(jsonResponse({ tasks: [] }));
          return;
        }
        if (p === "/api/pms") {
          if (request.method() === "GET") {
            await route.fulfill(jsonResponse(buildPmsWorkspaceMock()));
            return;
          }
          await route.fulfill(jsonResponse({ success: true }));
          return;
        }
        if (p === "/api/mission-flow") {
          if (request.method() === "GET") {
            await route.fulfill(jsonResponse(buildMissionFlowGetMock()));
            return;
          }
          await route.fulfill(
            jsonResponse(buildMissionFlowPostMock(safeParsePostJson(request)))
          );
          return;
        }
        if (p === "/api/roadmaps/synthesize") {
          await route.fulfill(
            jsonResponse(
              buildRoadmapsSynthesizeMock(safeParsePostJson(request))
            )
          );
          return;
        }
        if (p === "/api/metrics") {
          await route.fulfill(jsonResponse({ metrics: [] }));
          return;
        }
        if (p === "/api/command") {
          await route.fulfill(
            jsonResponse({
              success: true,
              weekStart: reqUrl.searchParams.get("weekStart") ?? "2026-11-23",
              northStars: [],
              fragos: {},
              aarLogs: [],
            })
          );
          return;
        }
        if (p === "/api/command/chat" && request.method() === "POST") {
          const body = safeParsePostJson(request);
          const prompt = typeof body.prompt === "string" ? body.prompt : "";
          const cal = prompt.match(/(\d{3,4})\s*(?:kcal|cal)/i);
          const prot = prompt.match(/(\d{2,3})\s*g?\s*(?:protein|prot)/i);
          const steps = prompt.match(/(\d{1,2},?\d{3}|\d{4,5})\s*(?:steps|neat)/i);
          if (cal) {
            strategyState.caloriesEaten = Number(cal[1]);
            strategyState.kcalDeficit = Math.max(0, 2250 - strategyState.caloriesEaten);
          }
          if (prot) strategyState.proteinG = Number(prot[1]);
          if (steps) strategyState.totalSteps = Number(steps[1].replace(/,/g, ""));
          await route.fulfill(
            jsonResponse({
              success: true,
              mutationType: "sitrep_telemetry",
              summary: `Updated live telemetry (calories_eaten: ${strategyState.caloriesEaten} · protein_g: ${strategyState.proteinG} · total_steps: ${strategyState.totalSteps})`,
              updatedFields: { ...strategyState },
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }
        if (p === "/api/scorecard") {
          const telemetrySeries = [
            { date: "2026-11-22", caloriesEaten: 1850, proteinG: 170, kcalDeficit: 320, totalSteps: 9100, sleepHours: 7.2, recoveryScore: 82 },
            { date: "2026-11-23", caloriesEaten: 1790, proteinG: 176, kcalDeficit: 360, totalSteps: 9400, sleepHours: 7.4, recoveryScore: 86 },
            { date: "2026-11-24", caloriesEaten: strategyState.caloriesEaten, proteinG: strategyState.proteinG, kcalDeficit: strategyState.kcalDeficit, totalSteps: strategyState.totalSteps, sleepHours: 7.6, recoveryScore: 90 },
          ];
          const driftWarnings = [];
          if (strategyState.caloriesEaten > 1700) {
            driftWarnings.push({ id: "drift-deficit", domain: "health", severity: "warning", title: "Caloric Deficit Drift Detected", message: "Trailing deficit below target.", metric: "3-Day Deficit", currentValue: `${strategyState.kcalDeficit} kcal`, threshold: ">= 350 kcal" });
          }
          if (strategyState.totalSteps < 10000) {
            driftWarnings.push({ id: "drift-steps", domain: "health", severity: "advisory", title: "Non-Exercise Activity (NEAT) Slippage", message: "Steps below 10,000 baseline.", metric: "7-Day Steps", currentValue: `${strategyState.totalSteps.toLocaleString()}`, threshold: "10,000 steps" });
          }
          const scorecards = [
            { domain: "health", title: "Health & Biometrics", leadKpiLabel: "7-Day SITREP Adherence", leadKpiValue: "86%", leadKpiTarget: "85%", leadKpiAdherencePct: 86, lagKpiLabel: "Current Weight", lagKpiValue: "162.4 lbs", grade: "A", trend: "up", bottleneckActive: false, activePace: "primary", chartPoints: telemetrySeries.map((t) => ({ label: t.date.slice(5), value: t.caloriesEaten <= 1750 ? 95 : 70 })), chartTarget: 85 },
            { domain: "wealth", title: "Wealth & SaaS Ops", leadKpiLabel: "Sovereign Sprint Completion", leadKpiValue: "82%", leadKpiTarget: "80%", leadKpiAdherencePct: 82, lagKpiLabel: "Sprint Throughput", lagKpiValue: "14/17 Tasks", grade: "B", trend: "up", bottleneckActive: false, activePace: "primary", chartPoints: [{ label: "Open", value: 18 }, { label: "Done", value: 82 }], chartTarget: 80 },
            { domain: "relationships", title: "Family & Relationships", leadKpiLabel: "Committed Pod Cadence", leadKpiValue: "88%", leadKpiTarget: "85%", leadKpiAdherencePct: 88, lagKpiLabel: "Household Harmony", lagKpiValue: "Protected", grade: "B", trend: "up", bottleneckActive: false, activePace: "primary", chartPoints: telemetrySeries.map((t) => ({ label: t.date.slice(5), value: 88 })), chartTarget: 85 },
            { domain: "happiness", title: "Pursuit of Happiness", leadKpiLabel: "Rest & Mindset Protocol", leadKpiValue: "7.6h Sleep", leadKpiTarget: "7.5h", leadKpiAdherencePct: 90, lagKpiLabel: "Cognitive Recovery", lagKpiValue: "90%", grade: "A", trend: "up", bottleneckActive: false, activePace: "primary", chartPoints: telemetrySeries.map((t) => ({ label: t.date.slice(5), value: t.recoveryScore })), chartTarget: 85 },
          ];
          await route.fulfill(jsonResponse({ success: true, scorecards, driftWarnings, telemetrySeries, activeBottlenecks: {} }));
          return;
        }
        if (p === "/api/kpi-scorecard") {
          await route.fulfill(jsonResponse(buildKpiScorecardMock()));
          return;
        }
        if (p === "/api/plaid") {
          await route.fulfill(
            jsonResponse({
              configured: false,
              environment: "sandbox",
              accounts: [],
            })
          );
          return;
        }
        await route.fulfill(jsonResponse({ ok: true }));
        return;
      }

      await route.continue();
    });

    await use(violations);
    expect(
      violations,
      `[SPEND_ISOLATION_VIOLATION] Outbound live production requests attempted: ${violations.join(", ")}`
    ).toEqual([]);
  },
});

export function attachRuntimeMonitors(page: Page, outboundViolations: string[]) {
  const uncaughtErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (err) => {
    uncaughtErrors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  return {
    assertHealthy: () => {
      expect(
        outboundViolations,
        `Live outbound calls blocked: ${outboundViolations.join(" | ")}`
      ).toEqual([]);
      expect(
        uncaughtErrors,
        `Uncaught page exceptions: ${uncaughtErrors.join(" | ")}`
      ).toEqual([]);
      expect(
        consoleErrors,
        `Console/hydration errors: ${consoleErrors.join(" | ")}`
      ).toEqual([]);
    },
  };
}

export { expect };
