import { test as base, expect, Page } from "@playwright/test";

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

/**
 * Keiji Kanazawa Isolated Browser Fixture:
 * 1. Hard-blocks & fails the test if any request attempts outbound egress to
 *    live Supabase, Gemini/OpenAI, Stripe, Plaid, or Google OAuth/Calendar APIs.
 * 2. Serves deterministic, zero-latency mock responses for local `/api/*` routes
 *    so autonomous UI fuzzing never mutates live databases or burns API spend.
 */
export const test = base.extend<{
  outboundViolations: string[];
}>({
  outboundViolations: async ({ context }, use) => {
    const violations: string[] = [];

    await context.route("**/*", async (route) => {
      const reqUrl = new URL(route.request().url());
      const host = reqUrl.hostname;

      if (FORBIDDEN_EXTERNAL_HOST_PATTERNS.some((re) => re.test(host))) {
        violations.push(`${route.request().method()} ${reqUrl.href}`);
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
          await route.fulfill(
            jsonResponse({
              user: { name: "Isolated Test Commander", email: "isolated@test.local" },
              role: "ADMIN",
              expires: "2099-01-01T00:00:00.000Z",
            })
          );
          return;
        }
        if (p === "/api/ui-preferences") {
          await route.fulfill(jsonResponse({ ok: true, preferences: {} }));
          return;
        }
        if (p === "/api/calendar-events") {
          await route.fulfill(jsonResponse({ events: [] }));
          return;
        }
        if (p === "/api/circadian") {
          await route.fulfill(jsonResponse({ events: [] }));
          return;
        }
        if (p === "/api/circadian/radar") {
          await route.fulfill(jsonResponse({ layers: [] }));
          return;
        }
        if (p === "/api/calendar-ops") {
          await route.fulfill(
            jsonResponse({
              ok: true,
              habits: [],
              highlightSpans: [],
              appointments: [],
            })
          );
          return;
        }
        if (p === "/api/calendar/google-sync") {
          await route.fulfill(jsonResponse({ connected: false, synced: 0 }));
          return;
        }
        if (p === "/api/tasks") {
          await route.fulfill(jsonResponse({ tasks: [] }));
          return;
        }
        if (p === "/api/mission-flow") {
          if (route.request().method() === "GET") {
            await route.fulfill(jsonResponse({ lessons: [] }));
            return;
          }
          await route.fulfill(
            jsonResponse({
              ok: true,
              id: "isolated-mission-01",
              deployedAt: "2026-11-20T00:00:00.000Z",
              pmsSynced: 3,
              calendarSynced: 2,
              lesson: {
                id: "isolated-aar-01",
                missionTitle: "Isolated Test Mission",
                domain: "master",
                whatWorked: "Deterministic state machine",
                whatBroke: "None",
                ruleChange: "Maintain isolation",
                createdAt: "2026-11-20T00:00:00.000Z",
              },
            })
          );
          return;
        }
        if (p === "/api/roadmaps/synthesize") {
          await route.fulfill(
            jsonResponse({
              success: true,
              message: "Isolated mock synthesis complete",
            })
          );
          return;
        }
        if (p === "/api/metrics") {
          await route.fulfill(jsonResponse({ metrics: [] }));
          return;
        }
        if (p === "/api/kpi-scorecard") {
          await route.fulfill(jsonResponse({ ok: true, snapshots: [], streakCount: 0 }));
          return;
        }
        if (p === "/api/plaid") {
          await route.fulfill(
            jsonResponse({ configured: false, environment: "sandbox", accounts: [] })
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

export { expect };
