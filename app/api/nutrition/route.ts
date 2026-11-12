import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

interface CaloriePresetSpec {
  key: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sodiumMg: number;
}

const CALORIE_PRESETS: Record<string, CaloriePresetSpec> = {
  "1250_cut": {
    key: "1250_cut",
    label: "1,250 Cut",
    calories: 1250,
    protein: 175,
    carbs: 65,
    fats: 32,
    sodiumMg: 2200,
  },
  "1500_rest": {
    key: "1500_rest",
    label: "1,500 Rest Day",
    calories: 1500,
    protein: 180,
    carbs: 100,
    fats: 42,
    sodiumMg: 2300,
  },
  "1750_training": {
    key: "1750_training",
    label: "1,750 Training Day",
    calories: 1750,
    protein: 185,
    carbs: 145,
    fats: 48,
    sodiumMg: 2500,
  },
  "2200_refeed": {
    key: "2200_refeed",
    label: "2,200 Refeed",
    calories: 2200,
    protein: 185,
    carbs: 255,
    fats: 49,
    sodiumMg: 2800,
  },
};

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMealTimestamp(dateStr: string, hour: number, minute: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hour, minute, 0, 0);
  return dt.toISOString();
}

async function recomputeDailyLog(dailyLogId: string) {
  const sums = await pgQuery<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    sodium_mg: number;
    weight_g: number;
  }>(
    `SELECT
       COALESCE(SUM(calories), 0)::int AS calories,
       COALESCE(SUM(protein_g), 0)::float8 AS protein_g,
       COALESCE(SUM(carbs_g), 0)::float8 AS carbs_g,
       COALESCE(SUM(fats_g), 0)::float8 AS fats_g,
       COALESCE(SUM(sodium_mg), 0)::int AS sodium_mg,
       COALESCE(SUM(weight_g), 0)::float8 AS weight_g
     FROM public.nutrition_meals
     WHERE daily_log_id = $1::uuid`,
    dailyLogId
  );

  const logs = await pgQuery<{ total_water_fl_oz: number }>(
    `SELECT COALESCE(total_water_fl_oz, 0)::float8 AS total_water_fl_oz
     FROM public.nutrition_daily_logs
     WHERE id = $1::uuid`,
    dailyLogId
  );

  const agg = sums[0] || {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
    sodium_mg: 0,
    weight_g: 0,
  };
  const waterFlOz = Number(logs[0]?.total_water_fl_oz ?? 0);
  const solidLbs = Number(agg.weight_g || 0) / 453.592;
  const waterLbs = waterFlOz * 0.0652;
  const totalWeightLbs = Number((solidLbs + waterLbs).toFixed(2));

  await pgExec(
    `UPDATE public.nutrition_daily_logs
     SET consumed_calories = $2::int,
         consumed_protein = $3::int,
         consumed_carbs = $4::int,
         consumed_fats = $5::int,
         consumed_sodium_mg = $6::int,
         total_weight_consumed_lbs = $7::numeric
     WHERE id = $1::uuid`,
    dailyLogId,
    Math.round(Number(agg.calories || 0)),
    Math.round(Number(agg.protein_g || 0)),
    Math.round(Number(agg.carbs_g || 0)),
    Math.round(Number(agg.fats_g || 0)),
    Math.round(Number(agg.sodium_mg || 0)),
    totalWeightLbs
  );
}

async function ensureDailyLogAndSeed(userId: string, dateStr: string) {
  let rows = await pgQuery<any>(
    `SELECT *, date::text AS date_str
     FROM public.nutrition_daily_logs
     WHERE user_id = $1 AND date = $2::date
     LIMIT 1`,
    userId,
    dateStr
  );

  if (rows.length === 0) {
    const countRows = await pgQuery<{ cnt: number }>(
      `SELECT COUNT(*)::int AS cnt FROM public.nutrition_daily_logs WHERE user_id = $1`,
      userId
    );
    const isFirstEverLoad = (countRows[0]?.cnt ?? 0) === 0;
    const preset = CALORIE_PRESETS["1750_training"];

    const inserted = await pgQuery<any>(
      `INSERT INTO public.nutrition_daily_logs (
         user_id, date, calorie_preset,
         target_calories, target_protein, target_carbs, target_fats, target_sodium_mg,
         total_water_fl_oz
       ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, date) DO UPDATE
         SET user_id = EXCLUDED.user_id
       RETURNING *, date::text AS date_str`,
      userId,
      dateStr,
      preset.key,
      preset.calories,
      preset.protein,
      preset.carbs,
      preset.fats,
      preset.sodiumMg,
      isFirstEverLoad ? 68 : 0
    );

    const log = inserted[0];

    if (isFirstEverLoad && log?.id) {
      const meal1Items = [
        {
          name: "Air-Fried Chicken Breast",
          scale: 1.1,
          grams: 220,
          calories: 363,
          protein_g: 68.2,
          carbs_g: 0,
          fats_g: 7.9,
          sodium_mg: 418,
        },
        {
          name: "Jasmine White Rice",
          scale: 0.9,
          grams: 180,
          calories: 234,
          protein_g: 4.3,
          carbs_g: 50.4,
          fats_g: 0.4,
          sodium_mg: 108,
        },
        {
          name: "Steamed Broccoli / Veg",
          scale: 1.0,
          grams: 150,
          calories: 52,
          protein_g: 4.2,
          carbs_g: 10.8,
          fats_g: 0.6,
          sodium_mg: 65,
        },
      ];

      const meal2Items = [
        {
          name: "Air-Fried Chicken Breast",
          scale: 0.9,
          grams: 180,
          calories: 297,
          protein_g: 55.8,
          carbs_g: 0,
          fats_g: 6.5,
          sodium_mg: 342,
        },
        {
          name: "Russet Potatoes",
          scale: 1.0,
          grams: 250,
          calories: 232,
          protein_g: 6.3,
          carbs_g: 53.0,
          fats_g: 0.3,
          sodium_mg: 240,
        },
      ];

      await pgExec(
        `INSERT INTO public.nutrition_meals (
           daily_log_id, name, meal_slot, logged_at,
           calories, protein_g, carbs_g, fats_g, sodium_mg, weight_g, food_items
         ) VALUES
         ($1::uuid, $2, $3, $4::timestamptz, $5, $6, $7, $8, $9, $10, $11::jsonb),
         ($1::uuid, $12, $13, $14::timestamptz, $15, $16, $17, $18, $19, $20, $21::jsonb)`,
        log.id,
        "Fast-Breaker Anabolic Bowl",
        "Meal 1",
        buildMealTimestamp(dateStr, 12, 15),
        649,
        76.7,
        61.2,
        8.9,
        591,
        550.0,
        JSON.stringify(meal1Items),
        "Post-Training Glycogen Plate",
        "Meal 2",
        buildMealTimestamp(dateStr, 15, 45),
        529,
        62.1,
        53.0,
        6.8,
        582,
        430.0,
        JSON.stringify(meal2Items)
      );

      await recomputeDailyLog(log.id);
    }

    rows = await pgQuery<any>(
      `SELECT *, date::text AS date_str
       FROM public.nutrition_daily_logs
       WHERE id = $1::uuid`,
      log.id
    );
  }

  const dailyLog = rows[0];
  const meals = await pgQuery<any>(
    `SELECT *
     FROM public.nutrition_meals
     WHERE daily_log_id = $1::uuid
     ORDER BY logged_at ASC`,
    dailyLog.id
  );

  const solidWeightGrams = meals.reduce(
    (sum, m) => sum + Number(m.weight_g || 0),
    0
  );
  const solidWeightLbs = Number((solidWeightGrams / 453.592).toFixed(2));
  const waterFlOz = Number(dailyLog.total_water_fl_oz || 0);
  const waterWeightLbs = Number((waterFlOz * 0.0652).toFixed(2));
  const totalPhysicalWeightLbs = Number(
    (solidWeightGrams / 453.592 + waterFlOz * 0.0652).toFixed(2)
  );

  const recentLogs = await pgQuery<any>(
    `SELECT id, date::text AS date_str, calorie_preset, target_calories,
            consumed_calories, consumed_protein, consumed_carbs, consumed_fats,
            total_water_fl_oz, total_weight_consumed_lbs
     FROM public.nutrition_daily_logs
     WHERE user_id = $1
     ORDER BY date DESC
     LIMIT 7`,
    userId
  );

  return {
    dailyLog: {
      ...dailyLog,
      date: dailyLog.date_str || dateStr,
    },
    meals: meals.map((m) => ({
      ...m,
      food_items: Array.isArray(m.food_items)
        ? m.food_items
        : typeof m.food_items === "string"
        ? JSON.parse(m.food_items || "[]")
        : [],
    })),
    metrics: {
      solidWeightGrams: Number(solidWeightGrams.toFixed(1)),
      solidWeightLbs,
      waterFlOz: Number(waterFlOz.toFixed(1)),
      waterWeightLbs,
      totalPhysicalWeightLbs,
    },
    presets: Object.values(CALORIE_PRESETS),
    recentLogs,
  };
}

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date") || getTodayIsoDate();
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : getTodayIsoDate();

  try {
    const userId = await getLivingOsUserId();
    const payload = await ensureDailyLogAndSeed(userId, safeDate);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[API /api/nutrition GET]", error);
    const preset = CALORIE_PRESETS["1750_training"];
    return NextResponse.json(
      {
        dailyLog: {
          id: "offline-fallback",
          date: safeDate,
          calorie_preset: preset.key,
          target_calories: preset.calories,
          target_protein: preset.protein,
          target_carbs: preset.carbs,
          target_fats: preset.fats,
          target_sodium_mg: preset.sodiumMg,
          consumed_calories: 0,
          consumed_protein: 0,
          consumed_carbs: 0,
          consumed_fats: 0,
          consumed_sodium_mg: 0,
          total_water_fl_oz: 0,
          total_weight_consumed_lbs: 0,
        },
        meals: [],
        metrics: {
          solidWeightGrams: 0,
          solidWeightLbs: 0,
          waterFlOz: 0,
          waterWeightLbs: 0,
          totalPhysicalWeightLbs: 0,
        },
        presets: Object.values(CALORIE_PRESETS),
        recentLogs: [],
        warning: error?.message || "Database fallback active",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");
    const safeDate =
      typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : getTodayIsoDate();

    const current = await ensureDailyLogAndSeed(userId, safeDate);
    const dailyLogId = current.dailyLog.id;

    if (action === "set_preset") {
      const presetKey = String(body.presetKey || "1750_training");
      const preset = CALORIE_PRESETS[presetKey] || CALORIE_PRESETS["1750_training"];

      await pgExec(
        `UPDATE public.nutrition_daily_logs
         SET calorie_preset = $2,
             target_calories = $3::int,
             target_protein = $4::int,
             target_carbs = $5::int,
             target_fats = $6::int,
             target_sodium_mg = $7::int
         WHERE id = $1::uuid`,
        dailyLogId,
        preset.key,
        preset.calories,
        preset.protein,
        preset.carbs,
        preset.fats,
        preset.sodiumMg
      );
    } else if (action === "add_water") {
      const delta = Number(body.deltaFlOz ?? 8);
      const nextWater = Math.max(
        0,
        Math.min(512, Number(current.dailyLog.total_water_fl_oz || 0) + delta)
      );

      await pgExec(
        `UPDATE public.nutrition_daily_logs
         SET total_water_fl_oz = $2::numeric
         WHERE id = $1::uuid`,
        dailyLogId,
        Number(nextWater.toFixed(2))
      );

      await recomputeDailyLog(dailyLogId);
    } else if (action === "set_water") {
      const exactWater = Math.max(0, Math.min(512, Number(body.flOz ?? 0)));
      await pgExec(
        `UPDATE public.nutrition_daily_logs
         SET total_water_fl_oz = $2::numeric
         WHERE id = $1::uuid`,
        dailyLogId,
        Number(exactWater.toFixed(2))
      );
      await recomputeDailyLog(dailyLogId);
    } else if (action === "log_meal") {
      const name = String(body.name || "Executive Meal").trim().slice(0, 100);
      const mealSlot = String(body.mealSlot || "Meal 1").trim().slice(0, 32);
      const loggedAt = body.loggedAt
        ? new Date(body.loggedAt).toISOString()
        : new Date().toISOString();
      const calories = Math.max(0, Math.round(Number(body.calories || 0)));
      const proteinG = Math.max(0, Number(Number(body.proteinG || 0).toFixed(1)));
      const carbsG = Math.max(0, Number(Number(body.carbsG || 0).toFixed(1)));
      const fatsG = Math.max(0, Number(Number(body.fatsG || 0).toFixed(1)));
      const sodiumMg = Math.max(0, Math.round(Number(body.sodiumMg || 0)));
      const weightG = Math.max(1, Number(Number(body.weightG || 100).toFixed(1)));
      const foodItems = Array.isArray(body.foodItems) ? body.foodItems : [];

      await pgExec(
        `INSERT INTO public.nutrition_meals (
           daily_log_id, name, meal_slot, logged_at,
           calories, protein_g, carbs_g, fats_g, sodium_mg, weight_g, food_items
         ) VALUES (
           $1::uuid, $2, $3, $4::timestamptz,
           $5::int, $6::numeric, $7::numeric, $8::numeric, $9::int, $10::numeric, $11::jsonb
         )`,
        dailyLogId,
        name,
        mealSlot,
        loggedAt,
        calories,
        proteinG,
        carbsG,
        fatsG,
        sodiumMg,
        weightG,
        JSON.stringify(foodItems)
      );

      await recomputeDailyLog(dailyLogId);
    } else {
      return NextResponse.json(
        { error: `Unsupported action: ${action}` },
        { status: 400 }
      );
    }

    const updated = await ensureDailyLogAndSeed(userId, safeDate);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/nutrition POST]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update nutrition log" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const mealId = req.nextUrl.searchParams.get("mealId");
    const dateParam = req.nextUrl.searchParams.get("date") || getTodayIsoDate();
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : getTodayIsoDate();

    if (!mealId) {
      return NextResponse.json({ error: "Missing mealId" }, { status: 400 });
    }

    const found = await pgQuery<{ daily_log_id: string }>(
      `SELECT m.daily_log_id
       FROM public.nutrition_meals m
       JOIN public.nutrition_daily_logs l ON l.id = m.daily_log_id
       WHERE m.id = $1::uuid AND l.user_id = $2
       LIMIT 1`,
      mealId,
      userId
    );

    if (found.length > 0) {
      await pgExec(
        `DELETE FROM public.nutrition_meals WHERE id = $1::uuid`,
        mealId
      );
      await recomputeDailyLog(found[0].daily_log_id);
    }

    const updated = await ensureDailyLogAndSeed(userId, safeDate);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/nutrition DELETE]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete meal" },
      { status: 500 }
    );
  }
}
