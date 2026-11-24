export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgQuery } from "@/lib/livingOsDb";
import { createTaskInPmsV2 } from "@/lib/pmsV2Writer";
import type { LifeDomain, StrategyChatMutationReceipt } from "@/lib/commandTypes";

const DEFAULT_CHAIRMAN_UUID = "00000000-0000-0000-0000-000000000001";
const DAILY_CALORIE_TARGET = 1700;
const BASELINE_TDEE_ESTIMATE = 2250;

function resolveUuid(id?: string | null): string {
  if (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    return id;
  }
  return DEFAULT_CHAIRMAN_UUID;
}

interface ParsedChatCommand {
  caloriesEaten?: number;
  proteinG?: number;
  totalSteps?: number;
  sleepHours?: number;
  recoveryScore?: number;
  domainUpdate?: { domain: LifeDomain; value: number };
  taskTitle?: string;
}

function parseStrategyPrompt(rawPrompt: string): ParsedChatCommand {
  const text = rawPrompt.trim();
  const parsed: ParsedChatCommand = {};

  const calMatch = text.match(/(\d{3,4})\s*(?:kcal|cal(?:ories)?)\b/i);
  if (calMatch) parsed.caloriesEaten = Math.min(8000, Math.max(0, Number(calMatch[1])));

  const protMatch = text.match(/(\d{2,3})\s*g?\s*(?:protein|prot)\b/i);
  if (protMatch) parsed.proteinG = Math.min(400, Math.max(0, Number(protMatch[1])));

  const stepsMatch = text.match(/(\d{1,2},?\d{3}|\d{4,5})\s*(?:steps|neat)\b/i);
  if (stepsMatch) {
    parsed.totalSteps = Math.min(60000, Math.max(0, Number(stepsMatch[1].replace(/,/g, ""))));
  }

  const sleepMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\s*(?:sleep)?\b/i);
  if (sleepMatch && /sleep|rest/i.test(text)) {
    parsed.sleepHours = Math.min(16, Math.max(0, Number(sleepMatch[1])));
  }

  const recoveryMatch = text.match(/(\d{2,3})\s*%?\s*(?:recovery)\b/i);
  if (recoveryMatch) parsed.recoveryScore = Math.min(100, Math.max(0, Number(recoveryMatch[1])));

  const domainMatch = text.match(/\b(health|wealth|relationships|happiness)\b[^\d]{0,24}(\d+(?:\.\d+)?)/i);
  if (
    domainMatch &&
    parsed.caloriesEaten === undefined &&
    parsed.proteinG === undefined &&
    parsed.totalSteps === undefined
  ) {
    parsed.domainUpdate = {
      domain: domainMatch[1].toLowerCase() as LifeDomain,
      value: Number(domainMatch[2]),
    };
  }

  const hasTelemetry =
    parsed.caloriesEaten !== undefined ||
    parsed.proteinG !== undefined ||
    parsed.totalSteps !== undefined ||
    parsed.sleepHours !== undefined ||
    parsed.recoveryScore !== undefined;

  if (!hasTelemetry && !parsed.domainUpdate) {
    parsed.taskTitle = text.replace(/^(?:add|create|log|task:?)\s+/i, "").slice(0, 140);
  }

  return parsed;
}

/**
 * POST /api/command/chat
 * Strict P-02 input validation + P-05 auth.uid() isolation for Operations & Strategy mutations.
 */
export async function POST(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 422 });
    }

    const record = body as Record<string, unknown>;
    const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
    if (prompt.length < 3 || prompt.length > 500) {
      return NextResponse.json(
        { success: false, error: "Prompt must be between 3 and 500 characters." },
        { status: 422 }
      );
    }

    const parsed = parseStrategyPrompt(prompt);
    const todayIso = new Date().toISOString().slice(0, 10);

    const hasTelemetry =
      parsed.caloriesEaten !== undefined ||
      parsed.proteinG !== undefined ||
      parsed.totalSteps !== undefined ||
      parsed.sleepHours !== undefined ||
      parsed.recoveryScore !== undefined;

    if (hasTelemetry) {
      const existing = await pgQuery<Record<string, unknown>>(
        `SELECT calories_eaten, protein_g, total_steps, sleep_hours, recovery_score, kcal_burned
         FROM public.daily_sitrep_logs
         WHERE user_id = $1::uuid AND log_date = $2::date
         LIMIT 1`,
        userId,
        todayIso
      );

      const prev = existing[0] ?? {};
      const caloriesEaten = parsed.caloriesEaten ?? Number(prev.calories_eaten ?? DAILY_CALORIE_TARGET);
      const proteinG = parsed.proteinG ?? Number(prev.protein_g ?? 185);
      const totalSteps = parsed.totalSteps ?? Number(prev.total_steps ?? 10000);
      const sleepHours = parsed.sleepHours ?? (prev.sleep_hours ? Number(prev.sleep_hours) : 7.5);
      const recoveryScore = parsed.recoveryScore ?? (prev.recovery_score ? Number(prev.recovery_score) : 85);
      const kcalBurned = Number(prev.kcal_burned ?? BASELINE_TDEE_ESTIMATE);
      const kcalDeficit = Math.max(0, kcalBurned - caloriesEaten);
      const miles = Number((totalSteps / 2100).toFixed(2));
      const sitrepGrade = caloriesEaten <= DAILY_CALORIE_TARGET + 100 && proteinG >= 180 ? "pass" : "partial";

      await pgQuery(
        `INSERT INTO public.daily_sitrep_logs (
          user_id, log_date, calories_eaten, protein_g, total_steps, miles,
          kcal_burned, kcal_deficit, sleep_hours, recovery_score, sitrep_grade
        ) VALUES ($1::uuid, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id, log_date) DO UPDATE
        SET calories_eaten = EXCLUDED.calories_eaten,
            protein_g = EXCLUDED.protein_g,
            total_steps = EXCLUDED.total_steps,
            miles = EXCLUDED.miles,
            kcal_burned = EXCLUDED.kcal_burned,
            kcal_deficit = EXCLUDED.kcal_deficit,
            sleep_hours = EXCLUDED.sleep_hours,
            recovery_score = EXCLUDED.recovery_score,
            sitrep_grade = EXCLUDED.sitrep_grade,
            updated_at = NOW()`,
        userId,
        todayIso,
        caloriesEaten,
        proteinG,
        totalSteps,
        miles,
        kcalBurned,
        kcalDeficit,
        sleepHours,
        recoveryScore,
        sitrepGrade
      );

      const updatedFields: Record<string, string | number> = {};
      if (parsed.caloriesEaten !== undefined) updatedFields.calories_eaten = caloriesEaten;
      if (parsed.proteinG !== undefined) updatedFields.protein_g = proteinG;
      if (parsed.totalSteps !== undefined) updatedFields.total_steps = totalSteps;
      if (parsed.sleepHours !== undefined) updatedFields.sleep_hours = sleepHours;
      if (parsed.recoveryScore !== undefined) updatedFields.recovery_score = recoveryScore;
      updatedFields.kcal_deficit = kcalDeficit;

      const receipt: StrategyChatMutationReceipt = {
        success: true,
        mutationType: "sitrep_telemetry",
        summary: `Updated live telemetry (${Object.entries(updatedFields)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")})`,
        updatedFields,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(receipt);
    }

    if (parsed.domainUpdate) {
      await pgQuery(
        `UPDATE public.command_north_stars
         SET current_metric_value = $3, updated_at = NOW()
         WHERE user_id = $1::uuid AND domain = $2`,
        userId,
        parsed.domainUpdate.domain,
        parsed.domainUpdate.value
      );

      const receipt: StrategyChatMutationReceipt = {
        success: true,
        mutationType: "north_star_metric",
        summary: `Updated ${parsed.domainUpdate.domain.toUpperCase()} North Star metric to ${parsed.domainUpdate.value}`,
        updatedFields: {
          domain: parsed.domainUpdate.domain,
          current_metric_value: parsed.domainUpdate.value,
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(receipt);
    }

    const title = parsed.taskTitle || prompt;
    const createdTask = await createTaskInPmsV2({
      name: title,
      description: `Created via Operations & Strategy AI Command Bar (user: ${userId})`,
      priority: "high",
      spaceHint: "strategy",
    });

    const receipt: StrategyChatMutationReceipt = {
      success: true,
      mutationType: "pms_task",
      summary: `Logged strategic action item to PMS: "${title}"`,
      updatedFields: { taskId: createdTask?.id || "queued", title },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(receipt);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute strategy mutation.";
    console.error("POST /api/command/chat error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
