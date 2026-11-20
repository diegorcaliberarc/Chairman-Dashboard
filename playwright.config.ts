import { defineConfig, devices } from "@playwright/test";

const ISOLATED_PORT = 3100;
const ISOLATED_BASE_URL = `http://127.0.0.1:${ISOLATED_PORT}`;

const SCRUBBED_WEBSERVER_ENV: Record<string, string> = {
  CHAIRMAN_TEST_ISOLATION: "1",
  DATABASE_URL:
    "postgresql://isolated:isolated@127.0.0.1:54399/chairman_isolated_test?schema=public",
  DIRECT_URL:
    "postgresql://isolated:isolated@127.0.0.1:54399/chairman_isolated_test?schema=public",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54399",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "isolated-anon-key-stub",
  SUPABASE_URL: "http://127.0.0.1:54399",
  SUPABASE_SERVICE_ROLE_KEY: "isolated-service-role-stub",
  GOOGLE_API_KEY: "isolated-llm-key-disabled",
  GEMINI_API_KEY: "isolated-llm-key-disabled",
  GOOGLE_GENERATIVE_AI_API_KEY: "isolated-llm-key-disabled",
  OPENAI_API_KEY: "isolated-llm-key-disabled",
  STRIPE_SECRET_KEY: "sk_test_isolated_stub",
  STRIPE_WEBHOOK_SECRET: "whsec_isolated_stub",
  PLAID_CLIENT_ID: "isolated-plaid-client-disabled",
  PLAID_SECRET: "isolated-plaid-secret-disabled",
  PLAID_ENV: "sandbox",
  GOOGLE_CLIENT_ID: "isolated-oauth-client-id",
  GOOGLE_CLIENT_SECRET: "isolated-oauth-client-secret",
  NEXTAUTH_SECRET: "isolated-nextauth-test-secret",
  NEXTAUTH_URL: ISOLATED_BASE_URL,
};

export default defineConfig({
  testDir: "./tests/properties",
  testMatch: "**/*.spec.ts",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: ISOLATED_BASE_URL,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npx next start -p ${ISOLATED_PORT} -H 127.0.0.1`,
    url: ISOLATED_BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: SCRUBBED_WEBSERVER_ENV,
  },
});
