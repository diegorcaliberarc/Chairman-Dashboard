import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import {
  DEFAULT_GLASS_THEME,
  GlassThemeConfig,
  normalizeGlassThemeConfig,
} from "@/lib/glassTheme";

export const dynamic = "force-dynamic";

interface UiPreferencesRow {
  user_id: string;
  glass_preset: string;
  color_mode: string;
  wheel_stops: any;
  grad_angle: number;
  glass_blur: number;
  glass_opacity: number;
  pals_visible: boolean;
  pals_scenario: string;
  updated_at?: string;
}

let tableEnsured = false;

async function ensureUiPreferencesTable(): Promise<void> {
  if (tableEnsured) return;
  await pgExec(`
    CREATE TABLE IF NOT EXISTS user_ui_preferences (
      user_id TEXT PRIMARY KEY,
      glass_preset TEXT NOT NULL DEFAULT 'northpeak-dark',
      color_mode TEXT NOT NULL DEFAULT 'dark',
      wheel_stops JSONB NOT NULL DEFAULT '[{"id":"primary","hue":228,"sat":94,"light":67,"hex":"#5B7CFA"},{"id":"secondary","hue":267,"sat":73,"light":63,"hex":"#9B5DE5"},{"id":"aura","hue":172,"sat":66,"light":50,"hex":"#2DD4BF"}]'::jsonb,
      grad_angle INTEGER NOT NULL DEFAULT 135,
      glass_blur INTEGER NOT NULL DEFAULT 26,
      glass_opacity NUMERIC(4,2) NOT NULL DEFAULT 0.62,
      pals_visible BOOLEAN NOT NULL DEFAULT TRUE,
      pals_scenario TEXT NOT NULL DEFAULT 'auto',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  tableEnsured = true;
}

function formatResponsePayload(
  row: UiPreferencesRow | null,
  persisted: boolean
) {
  const parsedStops =
    typeof row?.wheel_stops === "string"
      ? (() => {
          try {
            return JSON.parse(row.wheel_stops);
          } catch {
            return undefined;
          }
        })()
      : row?.wheel_stops;

  const theme: GlassThemeConfig = row
    ? normalizeGlassThemeConfig({
        presetId: row.glass_preset,
        colorMode: row.color_mode,
        wheelStops: parsedStops,
        gradAngle: row.grad_angle,
        glassBlur: row.glass_blur,
        glassOpacity: row.glass_opacity,
      })
    : DEFAULT_GLASS_THEME;

  const palsVisible =
    typeof row?.pals_visible === "boolean" ? row.pals_visible : true;
  const palsScenario =
    typeof row?.pals_scenario === "string" && row.pals_scenario
      ? row.pals_scenario
      : "auto";

  return {
    ok: true,
    persisted,
    theme,
    presetId: theme.presetId,
    colorMode: theme.colorMode,
    wheelStops: theme.wheelStops,
    gradAngle: theme.gradAngle,
    glassBlur: theme.glassBlur,
    glassOpacity: theme.glassOpacity,
    palsVisible,
    palsScenario,
    preferences: row
      ? {
          ...row,
          wheel_stops: theme.wheelStops,
        }
      : null,
  };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await ensureUiPreferencesTable();

    const rows = await pgQuery<UiPreferencesRow>(
      `SELECT user_id, glass_preset, color_mode, wheel_stops, grad_angle, glass_blur, glass_opacity, pals_visible, pals_scenario, updated_at
       FROM user_ui_preferences
       WHERE user_id = $1
       LIMIT 1`,
      userId
    );

    if (!rows.length) {
      return NextResponse.json(formatResponsePayload(null, false));
    }

    return NextResponse.json(formatResponsePayload(rows[0], true));
  } catch (err: any) {
    return NextResponse.json({
      ...formatResponsePayload(null, false),
      fallback: true,
      warning: err?.message || "Database unavailable; using client glass theme",
    });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const incomingSource =
    body?.theme && typeof body.theme === "object"
      ? { ...body, ...body.theme }
      : body;

  try {
    const userId = await getLivingOsUserId();
    await ensureUiPreferencesTable();

    const existingRows = await pgQuery<UiPreferencesRow>(
      `SELECT user_id, glass_preset, color_mode, wheel_stops, grad_angle, glass_blur, glass_opacity, pals_visible, pals_scenario
       FROM user_ui_preferences
       WHERE user_id = $1
       LIMIT 1`,
      userId
    );
    const existing = existingRows[0] ?? null;
    const existingTheme = existing
      ? formatResponsePayload(existing, true).theme
      : DEFAULT_GLASS_THEME;

    const mergedTheme = normalizeGlassThemeConfig({
      presetId:
        incomingSource.presetId ??
        incomingSource.glass_preset ??
        existingTheme.presetId,
      colorMode:
        incomingSource.colorMode ??
        incomingSource.color_mode ??
        existingTheme.colorMode,
      wheelStops:
        incomingSource.wheelStops ??
        incomingSource.wheel_stops ??
        existingTheme.wheelStops,
      gradAngle:
        incomingSource.gradAngle ??
        incomingSource.grad_angle ??
        existingTheme.gradAngle,
      glassBlur:
        incomingSource.glassBlur ??
        incomingSource.glass_blur ??
        existingTheme.glassBlur,
      glassOpacity:
        incomingSource.glassOpacity ??
        incomingSource.glass_opacity ??
        existingTheme.glassOpacity,
    });

    const palsVisible =
      typeof incomingSource.palsVisible === "boolean"
        ? incomingSource.palsVisible
        : typeof incomingSource.pals_visible === "boolean"
        ? incomingSource.pals_visible
        : existing?.pals_visible ?? true;

    const palsScenario =
      typeof incomingSource.palsScenario === "string"
        ? incomingSource.palsScenario
        : typeof incomingSource.pals_scenario === "string"
        ? incomingSource.pals_scenario
        : existing?.pals_scenario ?? "auto";

    const stopsJson = JSON.stringify(mergedTheme.wheelStops);

    const savedRows = await pgQuery<UiPreferencesRow>(
      `INSERT INTO user_ui_preferences (
         user_id,
         glass_preset,
         color_mode,
         wheel_stops,
         grad_angle,
         glass_blur,
         glass_opacity,
         pals_visible,
         pals_scenario,
         updated_at
       )
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         glass_preset  = EXCLUDED.glass_preset,
         color_mode    = EXCLUDED.color_mode,
         wheel_stops   = EXCLUDED.wheel_stops,
         grad_angle    = EXCLUDED.grad_angle,
         glass_blur    = EXCLUDED.glass_blur,
         glass_opacity = EXCLUDED.glass_opacity,
         pals_visible  = EXCLUDED.pals_visible,
         pals_scenario = EXCLUDED.pals_scenario,
         updated_at    = NOW()
       RETURNING user_id, glass_preset, color_mode, wheel_stops, grad_angle, glass_blur, glass_opacity, pals_visible, pals_scenario, updated_at`,
      userId,
      mergedTheme.presetId,
      mergedTheme.colorMode,
      stopsJson,
      mergedTheme.gradAngle,
      mergedTheme.glassBlur,
      mergedTheme.glassOpacity,
      palsVisible,
      palsScenario
    );

    return NextResponse.json(
      formatResponsePayload(savedRows[0] ?? null, true)
    );
  } catch (err: any) {
    const fallbackTheme = normalizeGlassThemeConfig(incomingSource);
    return NextResponse.json({
      ok: true,
      persisted: false,
      fallback: true,
      warning: err?.message || "Saved locally only; database unreachable",
      theme: fallbackTheme,
      presetId: fallbackTheme.presetId,
      colorMode: fallbackTheme.colorMode,
      wheelStops: fallbackTheme.wheelStops,
      gradAngle: fallbackTheme.gradAngle,
      glassBlur: fallbackTheme.glassBlur,
      glassOpacity: fallbackTheme.glassOpacity,
      palsVisible:
        typeof incomingSource.palsVisible === "boolean"
          ? incomingSource.palsVisible
          : true,
      palsScenario: incomingSource.palsScenario || "auto",
    });
  }
}
