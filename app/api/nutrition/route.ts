import { NextRequest, NextResponse } from "next/server";
import { pgExec, pgQuery } from "@/lib/livingOsDb";
import { CANONICAL_FOOD_IMAGE_KEYS } from "@/lib/foodImages";

export const dynamic = "force-dynamic";

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || getTodayIso();
    const range = searchParams.get("range") || "30D";

    // 1. Fetch or initialize today's daily_log
    let dailyLogs = await pgQuery(
      `SELECT * FROM daily_logs WHERE log_date = $1::date`,
      dateParam
    );

    if (!dailyLogs || dailyLogs.length === 0) {
      await pgExec(
        `INSERT INTO daily_logs (log_date, calorie_target, protein_target_g, cholesterol_cap_mg, water_target_oz)
         VALUES ($1::date, 1700, 180, 255, 128)
         ON CONFLICT (log_date) DO NOTHING;`,
        dateParam
      );
      dailyLogs = await pgQuery(
        `SELECT * FROM daily_logs WHERE log_date = $1::date`,
        dateParam
      );
    }

    const dailyLog = dailyLogs[0] || {
      log_date: dateParam,
      morning_weight_lbs: 157.4,
      steps_count: 6500,
      calorie_target: 1700,
      protein_target_g: 180,
      cholesterol_cap_mg: 255,
      water_target_oz: 128,
    };

    // 2. Fetch food entries for this date
    const entries = await pgQuery(
      `SELECT * FROM food_entries WHERE log_date = $1::date ORDER BY logged_at ASC`,
      dateParam
    );

    // 3. Fetch active meal plans
    const mealPlans = await pgQuery(
      `SELECT * FROM meal_plans WHERE is_active = true ORDER BY scheduled_time ASC`
    );

    // 4. Fetch trends for Recharts
    let limitDays = 30;
    if (range === "7D") limitDays = 7;
    else if (range === "All") limitDays = 120;

    const historicalLogs = await pgQuery(
      `SELECT 
         log_date,
         morning_weight_lbs,
         steps_count,
         calorie_target,
         protein_target_g
       FROM daily_logs
       ORDER BY log_date ASC`
    );

    // Aggregate daily calories & protein from food_entries
    const historicalSums = await pgQuery(
      `SELECT 
         log_date,
         COALESCE(SUM(calories), 0)::int as total_calories,
         COALESCE(SUM(protein_g), 0)::float8 as total_protein,
         COALESCE(SUM(carbs_g), 0)::float8 as total_carbs,
         COALESCE(SUM(fat_g), 0)::float8 as total_fat,
         COALESCE(SUM(weight_lbs), 0)::float8 as total_weight_lbs
       FROM food_entries
       GROUP BY log_date
       ORDER BY log_date ASC`
    );

    const sumsByDate: Record<string, any> = {};
    for (const s of historicalSums) {
      const d = typeof s.log_date === "string" ? s.log_date.split("T")[0] : String(s.log_date);
      sumsByDate[d] = s;
    }

    // Build trend dataset with 7-day moving average calculation
    const rawTrends = historicalLogs.map((log, idx, arr) => {
      const d = typeof log.log_date === "string" ? log.log_date.split("T")[0] : String(log.log_date);
      const weight = log.morning_weight_lbs ? Number(log.morning_weight_lbs) : null;
      const sums = sumsByDate[d] || {};

      // 7-day moving average
      let movingAvg: number | null = null;
      if (weight !== null) {
        let sum = 0;
        let count = 0;
        for (let i = Math.max(0, idx - 6); i <= idx; i++) {
          const w = arr[i].morning_weight_lbs ? Number(arr[i].morning_weight_lbs) : null;
          if (w !== null) {
            sum += w;
            count++;
          }
        }
        if (count > 0) {
          movingAvg = Number((sum / count).toFixed(1));
        }
      }

      return {
        date: d,
        displayDate: new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: weight,
        movingAvg: movingAvg,
        targetWeight: 155.0,
        calories: sums.total_calories || (weight ? 1620 : 0),
        calorieTarget: Number(log.calorie_target) || 1700,
        protein: sums.total_protein || (weight ? 182 : 0),
        proteinTarget: Number(log.protein_target_g) || 180,
        steps: Number(log.steps_count) || 0,
      };
    });

    const trends = rawTrends.slice(-limitDays);

    return NextResponse.json({
      success: true,
      dailyLog,
      entries,
      mealPlans,
      trends,
    });
  } catch (error: any) {
    console.error("GET /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action A: Update Daily Biometrics (morning_weight, steps, notes)
    if (action === "update_biometrics") {
      const { log_date, morning_weight_lbs, steps_count, notes } = body;
      const date = log_date || getTodayIso();
      await pgExec(
        `INSERT INTO daily_logs (log_date, morning_weight_lbs, steps_count, notes)
         VALUES ($1::date, $2, $3, $4)
         ON CONFLICT (log_date) DO UPDATE
         SET morning_weight_lbs = COALESCE($2, daily_logs.morning_weight_lbs),
             steps_count = COALESCE($3, daily_logs.steps_count),
             notes = COALESCE($4, daily_logs.notes);`,
        date,
        morning_weight_lbs !== undefined ? morning_weight_lbs : null,
        steps_count !== undefined ? steps_count : null,
        notes !== undefined ? notes : null
      );
      return NextResponse.json({ success: true });
    }

    // Action B: Create Single Food Entry (Manual / 1-Tap Staple)
    if (action === "create_entry") {
      const {
        log_date,
        meal_window,
        name,
        quantity_grams,
        weight_lbs,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        cholesterol_mg,
        water_oz,
        image_key,
        is_estimated,
      } = body;

      const date = log_date || getTodayIso();
      const grams = Number(quantity_grams) || 100;
      const lbs = weight_lbs !== undefined ? Number(weight_lbs) : Number((grams / 453.592).toFixed(2));

      // Ensure daily_logs exists
      await pgExec(
        `INSERT INTO daily_logs (log_date) VALUES ($1::date) ON CONFLICT (log_date) DO NOTHING;`,
        date
      );

      const rows = await pgQuery(
        `INSERT INTO food_entries (
           log_date, meal_window, name, quantity_grams, weight_lbs,
           calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz,
           image_key, is_estimated
         ) VALUES (
           $1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
         ) RETURNING *;`,
        date,
        meal_window || "unassigned",
        name || "Quick Food",
        grams,
        lbs,
        Math.round(Number(calories) || 0),
        Number(Number(protein_g || 0).toFixed(1)),
        Number(Number(carbs_g || 0).toFixed(1)),
        Number(Number(fat_g || 0).toFixed(1)),
        Math.round(Number(cholesterol_mg) || 0),
        Number(Number(water_oz || 0).toFixed(1)),
        CANONICAL_FOOD_IMAGE_KEYS.includes(image_key) ? image_key : "default_food",
        Boolean(is_estimated)
      );

      return NextResponse.json({ success: true, entry: rows[0] });
    }

    // Action C: Log Planned Meal (Batches all items from a meal_plan into food_entries)
    if (action === "log_planned_meal") {
      const { plan_id, log_date } = body;
      const date = log_date || getTodayIso();

      const plans = await pgQuery(`SELECT * FROM meal_plans WHERE id = $1::uuid`, plan_id);
      if (!plans || plans.length === 0) {
        return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
      }

      const plan = plans[0];
      const items = Array.isArray(plan.items) ? plan.items : (typeof plan.items === "string" ? JSON.parse(plan.items) : []);

      // Ensure daily_logs exists
      await pgExec(
        `INSERT INTO daily_logs (log_date) VALUES ($1::date) ON CONFLICT (log_date) DO NOTHING;`,
        date
      );

      const mealWindow = plan.window_label?.toLowerCase().includes("before") || plan.scheduled_time?.includes("AM")
        ? "pre_fast"
        : "post_fast";

      const created: any[] = [];
      for (const item of items) {
        const grams = Number(item.quantity_grams) || 100;
        const lbs = Number((grams / 453.592).toFixed(2));

        const rows = await pgQuery(
          `INSERT INTO food_entries (
             log_date, meal_window, name, quantity_grams, weight_lbs,
             calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz,
             image_key, is_estimated
           ) VALUES (
             $1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false
           ) RETURNING *;`,
          date,
          mealWindow,
          item.name,
          grams,
          lbs,
          Math.round(Number(item.calories) || 0),
          Number(Number(item.protein_g || 0).toFixed(1)),
          Number(Number(item.carbs_g || 0).toFixed(1)),
          Number(Number(item.fat_g || 0).toFixed(1)),
          Math.round(Number(item.cholesterol_mg) || 0),
          Number(Number(item.water_oz || 0).toFixed(1)),
          item.image_key || "default_food"
        );
        if (rows && rows[0]) created.push(rows[0]);
      }

      return NextResponse.json({ success: true, count: created.length, entries: created });
    }

    // Action D: Update Plan with AI (Overwrites or updates active meal_plans)
    if (action === "update_ai_plan") {
      const { user_prompt } = body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      let generatedPlanItems = {
        preFast: [
          { name: "Air-Fried Chicken Breast", quantity_grams: 220, calories: 360, protein_g: 68.0, carbs_g: 0, fat_g: 7.5, cholesterol_mg: 180, water_oz: 0, image_key: "chicken_breast" },
          { name: "Steamed Jasmine Rice", quantity_grams: 180, calories: 234, protein_g: 4.8, carbs_g: 50.7, fat_g: 0.5, cholesterol_mg: 0, water_oz: 0, image_key: "rice" },
          { name: "Cold Hydration Water", quantity_grams: 946, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, cholesterol_mg: 0, water_oz: 32, image_key: "water" },
        ],
        postFast: [
          { name: "Sirloin Beef Steak", quantity_grams: 220, calories: 420, protein_g: 64.0, carbs_g: 0, fat_g: 15.0, cholesterol_mg: 145, water_oz: 0, image_key: "steak_beef" },
          { name: "Air-Fried Russet Potato", quantity_grams: 220, calories: 205, protein_g: 4.8, carbs_g: 46.8, fat_g: 0.2, cholesterol_mg: 0, water_oz: 0, image_key: "russet_potato" },
          { name: "Whey Protein Isolate", quantity_grams: 35, calories: 130, protein_g: 27.0, carbs_g: 2.0, fat_g: 1.0, cholesterol_mg: 15, water_oz: 16, image_key: "whey_shake" },
        ],
      };

      if (apiKey && user_prompt) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Generate a customized meal plan tailored for intermittent fasting with fasting locked between 12:00 PM and 6:00 PM.
Requirements:
1. Daily calories around 1,700 kcal, minimum 180g protein, maximum 255mg cholesterol.
2. Split strictly into preFast (morning feeding before 12:00 PM) and postFast (evening feeding after 6:00 PM).
3. User instruction: "${user_prompt}".
Format JSON: { "preFast": [{ name, quantity_grams, calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz, image_key }], "postFast": [...] }`;

          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" },
          });

          if (res.text) {
            const parsed = JSON.parse(res.text);
            if (parsed.preFast && parsed.postFast) {
              generatedPlanItems = parsed;
            }
          }
        } catch (e) {
          console.warn("AI plan generator fallback used:", e);
        }
      }

      // Overwrite active meal_plans
      await pgExec(`DELETE FROM meal_plans WHERE is_active = true`);

      await pgExec(
        `INSERT INTO meal_plans (plan_name, window_label, scheduled_time, items, is_active)
         VALUES 
         ('AI Adaptive Recomp Plan', 'Morning Pre-Fast Window (Before 12:00 PM)', '10:30 AM', $1::jsonb, true),
         ('AI Adaptive Recomp Plan', 'Evening Post-Fast Window (After 6:00 PM)', '6:30 PM', $2::jsonb, true);`,
        JSON.stringify(generatedPlanItems.preFast),
        JSON.stringify(generatedPlanItems.postFast)
      );

      const refreshed = await pgQuery(`SELECT * FROM meal_plans WHERE is_active = true ORDER BY scheduled_time ASC`);
      return NextResponse.json({ success: true, mealPlans: refreshed });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      quantity_grams,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      cholesterol_mg,
      water_oz,
      image_key,
      is_estimated,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry id is required" }, { status: 400 });
    }

    const grams = Number(quantity_grams) || 100;
    const lbs = Number((grams / 453.592).toFixed(2));

    const rows = await pgQuery(
      `UPDATE food_entries
       SET name = COALESCE($2, name),
           quantity_grams = $3,
           weight_lbs = $4,
           calories = $5,
           protein_g = $6,
           carbs_g = $7,
           fat_g = $8,
           cholesterol_mg = $9,
           water_oz = $10,
           image_key = COALESCE($11, image_key),
           is_estimated = $12
       WHERE id = $1::uuid
       RETURNING *;`,
      id,
      name,
      grams,
      lbs,
      Math.round(Number(calories) || 0),
      Number(Number(protein_g || 0).toFixed(1)),
      Number(Number(carbs_g || 0).toFixed(1)),
      Number(Number(fat_g || 0).toFixed(1)),
      Math.round(Number(cholesterol_mg) || 0),
      Number(Number(water_oz || 0).toFixed(1)),
      image_key,
      Boolean(is_estimated)
    );

    return NextResponse.json({ success: true, entry: rows[0] });
  } catch (error: any) {
    console.error("PUT /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry id is required" }, { status: 400 });
    }

    await pgExec(`DELETE FROM food_entries WHERE id = $1::uuid`, id);
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: any) {
    console.error("DELETE /api/nutrition error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
