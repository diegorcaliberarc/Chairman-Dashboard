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
