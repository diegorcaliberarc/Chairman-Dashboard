import { beforeEach } from "vitest";

const SCRUBBED_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PLAID_CLIENT_ID",
  "PLAID_SECRET",
  "GOOGLE_CLIENT_SECRET",
];

for (const key of SCRUBBED_KEYS) {
  process.env[key] = "";
}
process.env.CHAIRMAN_TEST_ISOLATION = "1";

beforeEach(() => {
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const urlStr = typeof input === "string" ? input : input.toString();
    throw new Error(
      `[SPEND_ISOLATION_VIOLATION] Unmocked fetch('${urlStr}') blocked in Vitest unit runner.`
    );
  };
});
