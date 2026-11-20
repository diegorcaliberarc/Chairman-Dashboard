export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

async function ensurePlaidSchema() {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS plaid_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'depository',
      account_subtype TEXT NOT NULL DEFAULT 'checking',
      mask TEXT DEFAULT '',
      current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
      available_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function getPlaidBaseUrl(env: string): string {
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await ensurePlaidSchema();

    const configured = Boolean(
      process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET
    );
    const plaidEnv = process.env.PLAID_ENV || "sandbox";

    const accounts = await pgQuery<any>(
      `SELECT id, institution_name, account_name, account_type, account_subtype, mask,
              current_balance, available_balance, source, updated_at
       FROM plaid_accounts
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      userId
    );

    return NextResponse.json({
      configured,
      environment: plaidEnv,
      accounts: accounts.map((a) => ({
        id: a.id,
        institutionName: a.institution_name,
        accountName: a.account_name,
        accountType: a.account_type,
        accountSubtype: a.account_subtype,
        mask: a.mask || "",
        currentBalance: Number(a.current_balance || 0),
        availableBalance: Number(a.available_balance || 0),
        source: a.source || "manual",
        updatedAt: a.updated_at,
      })),
    });
  } catch (err: any) {
    console.error("Plaid GET error:", err);
    return NextResponse.json(
      { error: "Failed to load banking accounts", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    await ensurePlaidSchema();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create_link_token") {
      const clientId = process.env.PLAID_CLIENT_ID;
      const secret = process.env.PLAID_SECRET;
      const env = process.env.PLAID_ENV || "sandbox";

      if (!clientId || !secret) {
        return NextResponse.json(
          {
            configured: false,
            error:
              "Plaid credentials not set yet. Add PLAID_CLIENT_ID and PLAID_SECRET (and optional PLAID_ENV=sandbox|production) in your .env.local or Vercel environment variables.",
          },
          { status: 200 }
        );
      }

      const res = await fetch(`${getPlaidBaseUrl(env)}/link/token/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          secret,
          client_name: "Chairman Dashboard",
          user: { client_user_id: userId },
          products: ["transactions"],
          country_codes: ["US"],
          language: "en",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { configured: true, error: data.error_message || "Plaid Link token failed", detail: data },
          { status: 400 }
        );
      }
      return NextResponse.json({
        configured: true,
        linkToken: data.link_token,
        expiration: data.expiration,
      });
    }

    if (action === "add_account") {
      const institutionName = String(body.institutionName || "").trim();
      const accountName = String(body.accountName || "").trim();
      if (!institutionName || !accountName) {
        return NextResponse.json({ error: "Institution and account name are required" }, { status: 400 });
      }
      await pgExec(
        `INSERT INTO plaid_accounts (user_id, institution_name, account_name, account_type, account_subtype, mask, current_balance, available_balance, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')`,
        userId,
        institutionName.slice(0, 80),
        accountName.slice(0, 80),
        String(body.accountType || "depository"),
        String(body.accountSubtype || "checking"),
        String(body.mask || "").slice(0, 8),
        Number(body.currentBalance || 0),
        Number(body.availableBalance ?? body.currentBalance ?? 0)
      );
      return NextResponse.json({ success: true });
    }

    if (action === "delete_account" && body.id) {
      await pgExec(
        `DELETE FROM plaid_accounts WHERE id = $1::uuid AND user_id = $2`,
        body.id,
        userId
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown Plaid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Plaid POST error:", err);
    return NextResponse.json(
      { error: "Plaid request failed", detail: err?.message },
      { status: 500 }
    );
  }
}
