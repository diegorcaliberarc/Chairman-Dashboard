export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import { DailySitrepLog } from "@/lib/commandTypes";

const DEFAULT_CHAIRMAN_UUID = "00000000-0000-0000-0000-000000000001";

function resolveUuid(id?: string | null): string {
  if (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    return id;
  }
  return DEFAULT_CHAIRMAN_UUID;
}

function formatDateIso(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

// GET /api/sitrep?date=YYYY-MM-DD&limit=60
export async function GET(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const limitParam = parseInt(searchParams.get("limit") || "60", 10);

    // Fetch history
    const historyRows = await pgQuery<any>(
      `SELECT id, user_id, log_date, morning_weight_lbs, moving_avg_7d_lbs,
              total_steps, miles, calories_eaten, kcal_burned, kcal_deficit,
              protein_g, water_oz, sleep_hours, recovery_score, lift_completed,
              cardio_completed, fasting_hours, sitrep_grade, notes, created_at, updated_at
       FROM public.daily_sitrep_logs
       WHERE user_id = $1::uuid
       ORDER BY log_date DESC
       LIMIT $2`,
      userId,
      limitParam
    );

    const history: DailySitrepLog[] = historyRows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      log_date: formatDateIso(r.log_date),
      morning_weight_lbs: r.morning_weight_lbs !== null ? Number(r.morning_weight_lbs) : null,
      moving_avg_7d_lbs: r.moving_avg_7d_lbs !== null ? Number(r.moving_avg_7d_lbs) : null,
      total_steps: Number(r.total_steps || 0),
      miles: Number(r.miles || 0),
      calories_eaten: Number(r.calories_eaten || 0),
      kcal_burned: Number(r.kcal_burned || 0),
      kcal_deficit: Number(r.kcal_deficit || 0),
      protein_g: Number(r.protein_g || 0),
      water_oz: Number(r.water_oz || 0),
      sleep_hours: r.sleep_hours !== null ? Number(r.sleep_hours) : null,
      recovery_score: r.recovery_score !== null ? Number(r.recovery_score) : null,
      lift_completed: Boolean(r.lift_completed),
      cardio_completed: Boolean(r.cardio_completed),
      fasting_hours: r.fasting_hours !== null ? Number(r.fasting_hours) : null,
      sitrep_grade: r.sitrep_grade || "miss",
      notes: r.notes || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    // Find requested day or most recent log
    const todayLog = history.find((h) => h.log_date === dateParam) || null;

    // Fetch target weight from command_north_stars (Health domain)
    const targetRows = await pgQuery<any>(
      `SELECT target_metric_value FROM public.command_north_stars
       WHERE user_id = $1::uuid AND domain = 'health'
       LIMIT 1`,
      userId
    );
    const targetWeightLbs = targetRows.length > 0 ? Number(targetRows[0].target_metric_value) : 155.0;

    // Compute KPI stats
    const latest = history[0] || null;
    const previous = history[1] || null;

    const currentWeight = todayLog?.morning_weight_lbs ?? latest?.morning_weight_lbs ?? null;
    const prevWeight = previous?.morning_weight_lbs ?? null;
    const weightDelta = currentWeight && prevWeight ? Number((currentWeight - prevWeight).toFixed(2)) : null;

    const movingAvg = todayLog?.moving_avg_7d_lbs ?? latest?.moving_avg_7d_lbs ?? currentWeight;
    const distanceToTarget = movingAvg ? Number((movingAvg - targetWeightLbs).toFixed(2)) : null;

    // Rolling 7-day stats
    const last7 = history.slice(0, 7);
    const passCount = last7.filter((x) => x.sitrep_grade === "pass").length;
    const passRatePct = last7.length > 0 ? Math.round((passCount / last7.length) * 100) : 0;
    const avgDeficit =
      last7.length > 0
        ? Math.round(last7.reduce((sum, item) => sum + item.kcal_deficit, 0) / last7.length)
        : 0;
    const avgProtein =
      last7.length > 0
        ? Math.round(last7.reduce((sum, item) => sum + item.protein_g, 0) / last7.length)
        : 0;
    const avgSteps =
      last7.length > 0
        ? Math.round(last7.reduce((sum, item) => sum + item.total_steps, 0) / last7.length)
        : 0;

    return NextResponse.json({
      success: true,
      date: dateParam,
      todayLog,
      history,
      targetWeightLbs,
      stats: {
        currentWeight,
        weightDelta,
        movingAvg,
        targetWeightLbs,
        distanceToTarget,
        passRatePct,
        avgDeficit,
        avgProtein,
        avgSteps,
        totalEntries: history.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/sitrep error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/sitrep - Fast daily entry upsert
export async function POST(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const body = await req.json();
    const logDate = body.log_date || new Date().toISOString().slice(0, 10);

    const morningWeight = body.morning_weight_lbs !== undefined && body.morning_weight_lbs !== "" && body.morning_weight_lbs !== null
      ? Number(body.morning_weight_lbs)
      : null;
    const totalSteps = parseInt(body.total_steps || "0", 10);
    const caloriesEaten = parseInt(body.calories_eaten || "0", 10);
    const kcalBurned = parseInt(body.kcal_burned || "0", 10);
    const proteinG = parseFloat(body.protein_g || "0");
    const waterOz = parseFloat(body.water_oz || "0");
    const sleepHours = body.sleep_hours !== undefined && body.sleep_hours !== "" && body.sleep_hours !== null
      ? parseFloat(body.sleep_hours)
      : null;
    const recoveryScore = body.recovery_score !== undefined && body.recovery_score !== "" && body.recovery_score !== null
      ? parseInt(body.recovery_score, 10)
      : null;
    const liftCompleted = Boolean(body.lift_completed);
    const cardioCompleted = Boolean(body.cardio_completed);
    const fastingHours = body.fasting_hours !== undefined && body.fasting_hours !== "" && body.fasting_hours !== null
      ? parseFloat(body.fasting_hours)
      : null;
    const notes = body.notes || null;

    // Upsert into daily_sitrep_logs (trigger automatically fires to compute moving_avg_7d_lbs, miles, kcal_deficit, and sitrep_grade!)
    const rows = await pgQuery<any>(
      `INSERT INTO public.daily_sitrep_logs (
        user_id, log_date, morning_weight_lbs, total_steps, calories_eaten, kcal_burned,
        protein_g, water_oz, sleep_hours, recovery_score, lift_completed, cardio_completed,
        fasting_hours, notes
      ) VALUES (
        $1::uuid, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (user_id, log_date) DO UPDATE
      SET morning_weight_lbs = EXCLUDED.morning_weight_lbs,
          total_steps = EXCLUDED.total_steps,
          calories_eaten = EXCLUDED.calories_eaten,
          kcal_burned = EXCLUDED.kcal_burned,
          protein_g = EXCLUDED.protein_g,
          water_oz = EXCLUDED.water_oz,
          sleep_hours = EXCLUDED.sleep_hours,
          recovery_score = EXCLUDED.recovery_score,
          lift_completed = EXCLUDED.lift_completed,
          cardio_completed = EXCLUDED.cardio_completed,
          fasting_hours = EXCLUDED.fasting_hours,
          notes = EXCLUDED.notes
      RETURNING *;`,
      userId,
      logDate,
      morningWeight,
      totalSteps,
      caloriesEaten,
      kcalBurned,
      proteinG,
      waterOz,
      sleepHours,
      recoveryScore,
      liftCompleted,
      cardioCompleted,
      fastingHours,
      notes
    );

    const saved = rows[0];

    return NextResponse.json({
      success: true,
      entry: {
        id: saved.id,
        user_id: saved.user_id,
        log_date: formatDateIso(saved.log_date),
        morning_weight_lbs: saved.morning_weight_lbs !== null ? Number(saved.morning_weight_lbs) : null,
        moving_avg_7d_lbs: saved.moving_avg_7d_lbs !== null ? Number(saved.moving_avg_7d_lbs) : null,
        total_steps: Number(saved.total_steps || 0),
        miles: Number(saved.miles || 0),
        calories_eaten: Number(saved.calories_eaten || 0),
        kcal_burned: Number(saved.kcal_burned || 0),
        kcal_deficit: Number(saved.kcal_deficit || 0),
        protein_g: Number(saved.protein_g || 0),
        water_oz: Number(saved.water_oz || 0),
        sleep_hours: saved.sleep_hours !== null ? Number(saved.sleep_hours) : null,
        recovery_score: saved.recovery_score !== null ? Number(saved.recovery_score) : null,
        lift_completed: Boolean(saved.lift_completed),
        cardio_completed: Boolean(saved.cardio_completed),
        fasting_hours: saved.fasting_hours !== null ? Number(saved.fasting_hours) : null,
        sitrep_grade: saved.sitrep_grade,
        notes: saved.notes,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/sitrep error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/sitrep?id=...
export async function DELETE(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing log ID" }, { status: 400 });
    }

    await pgExec(
      `DELETE FROM public.daily_sitrep_logs WHERE id = $1::uuid AND user_id = $2::uuid`,
      id,
      userId
    );

    return NextResponse.json({ success: true, message: "Log entry deleted" });
  } catch (error: any) {
    console.error("DELETE /api/sitrep error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
