import { spawnSync } from "node:child_process";

/**
 * Keiji Kanazawa Production & Spend Isolation Launcher:
 * Scrubs live .env credentials by explicitly populating inert loopback/stub
 * values in process.env BEFORE Next.js, Playwright, or Vitest loads .env files
 * (since @next/env & dotenv never overwrite already-defined process.env keys).
 */
export const ISOLATED_ENV_OVERRIDES = {
  CHAIRMAN_TEST_ISOLATION: "1",
  DATABASE_URL: "postgresql://isolated:isolated@127.0.0.1:54399/chairman_isolated_test?schema=public",
  DIRECT_URL: "postgresql://isolated:isolated@127.0.0.1:54399/chairman_isolated_test?schema=public",
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
  NEXTAUTH_URL: "http://127.0.0.1:3100",
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("with-isolated-env.mjs")) {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) {
    console.error("Usage: node scripts/with-isolated-env.mjs <command> [...args]");
    process.exit(1);
  }
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...ISOLATED_ENV_OVERRIDES,
    },
  });
  process.exit(res.status ?? 1);
}
