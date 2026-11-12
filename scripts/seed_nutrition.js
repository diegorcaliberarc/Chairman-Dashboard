const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding historical data for daily_logs...");

  // Generate Oct 2 to Nov 11 data
  const startDate = new Date(2026, 9, 2); // Oct 2, 2026
  const endDate = new Date(2026, 10, 11); // Nov 11, 2026

  let cur = new Date(startDate);
  let baseWeight = 164.2;

  while (cur <= endDate) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    // Slow steady downward trend toward 155 lbs with realistic daily water fluctuation (+/- 0.6)
    baseWeight -= 0.16;
    const fluctuation = (Math.sin(cur.getDate() * 1.5) * 0.5);
    const weight = Number((baseWeight + fluctuation).toFixed(1));
    const steps = 8000 + Math.floor(Math.sin(cur.getDate()) * 2500) + 1200;

    await prisma.$executeRawUnsafe(
      `INSERT INTO daily_logs (log_date, morning_weight_lbs, steps_count, calorie_target, protein_target_g, cholesterol_cap_mg, water_target_oz)
       VALUES ($1::date, $2, $3, 1700, 180, 255, 128)
       ON CONFLICT (log_date) DO UPDATE 
       SET morning_weight_lbs = EXCLUDED.morning_weight_lbs,
           steps_count = EXCLUDED.steps_count;`,
      dateStr,
      weight,
      steps
    );

    // Also seed sample food entries for some days so calorie/protein charts have historical data
    const cal = 1580 + Math.floor(Math.cos(cur.getDate()) * 140);
    const prot = 175 + Math.floor(Math.sin(cur.getDate()) * 18);
    const carbs = 110;
    const fat = 38;

    // Check if food entries exist for that date
    const existing = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int as count FROM food_entries WHERE log_date = $1::date`,
      dateStr
    );
    if (existing[0]?.count === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO food_entries (log_date, meal_window, name, quantity_grams, weight_lbs, calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz, image_key, is_estimated)
         VALUES 
         ($1::date, 'pre_fast', 'Pre-Fast Protein Anchor', 350, 0.77, $2, $3, $4, $5, 140, 40, 'chicken_breast', false);`,
        dateStr,
        cal,
        prot,
        carbs,
        fat
      );
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Ensure today's daily_logs exists (Nov 12, 2026)
  const todayStr = "2026-11-12";
  await prisma.$executeRawUnsafe(
    `INSERT INTO daily_logs (log_date, morning_weight_lbs, steps_count, calorie_target, protein_target_g, cholesterol_cap_mg, water_target_oz)
     VALUES ($1::date, 157.4, 6200, 1700, 180, 255, 128)
     ON CONFLICT (log_date) DO NOTHING;`,
    todayStr
  );

  // Check today's food entries; if none, seed sample today entries
  const todayCount = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as count FROM food_entries WHERE log_date = $1::date`,
    todayStr
  );

  if (todayCount[0]?.count === 0) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO food_entries (log_date, meal_window, raw_input, name, quantity_grams, weight_lbs, calories, protein_g, carbs_g, fat_g, cholesterol_mg, water_oz, image_key, is_estimated)
       VALUES 
       ($1::date, 'pre_fast', '180g air-fried chicken breast', 'Air-Fried Chicken Breast', 180, 0.40, 297, 55.8, 0, 6.5, 153, 0, 'chicken_breast', false),
       ($1::date, 'pre_fast', '200g air-fried russet potato', 'Air-Fried Russet Potato', 200, 0.44, 186, 4.3, 42.6, 0.2, 0, 0, 'russet_potato', false),
       ($1::date, 'pre_fast', '32oz cold electrolyte water', 'Electrolyte Hydration Water', 946, 2.08, 0, 0, 0, 0, 0, 32, 'electrolytes', false),
       ($1::date, 'post_fast', '1 scoop whey isolate with water', 'Whey Protein Isolate Shake', 32, 0.07, 120, 25.0, 2.0, 1.0, 15, 12, 'whey_shake', false);`,
      todayStr
    );
    console.log("Today sample food entries seeded.");
  }

  // Seed default active meal plans
  const planCount = await prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM meal_plans`);
  if (planCount[0]?.count === 0) {
    const preFastItems = JSON.stringify([
      { name: "Air-Fried Chicken Breast", quantity_grams: 200, weight_lbs: 0.44, calories: 330, protein_g: 62.0, carbs_g: 0.0, fat_g: 7.2, cholesterol_mg: 170, water_oz: 0, image_key: "chicken_breast", is_estimated: false },
      { name: "Crispy Air-Fried Russet Potato", quantity_grams: 220, weight_lbs: 0.48, calories: 205, protein_g: 4.8, carbs_g: 46.8, fat_g: 0.2, cholesterol_mg: 0, water_oz: 0, image_key: "russet_potato", is_estimated: false },
      { name: "Electrolyte Water", quantity_grams: 946, weight_lbs: 2.08, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, cholesterol_mg: 0, water_oz: 32, image_key: "electrolytes", is_estimated: false }
    ]);

    const postFastItems = JSON.stringify([
      { name: "Grass-Fed Top Sirloin Steak", quantity_grams: 220, weight_lbs: 0.48, calories: 420, protein_g: 66.0, carbs_g: 0.0, fat_g: 16.0, cholesterol_mg: 140, water_oz: 0, image_key: "steak_beef", is_estimated: false },
      { name: "Large Mixed Salad Greens & Cucumber", quantity_grams: 250, weight_lbs: 0.55, calories: 45, protein_g: 3.2, carbs_g: 8.5, fat_g: 0.5, cholesterol_mg: 0, water_oz: 0, image_key: "salad_greens", is_estimated: false },
      { name: "Whey Protein Isolate Shake", quantity_grams: 35, weight_lbs: 0.08, calories: 130, protein_g: 27.0, carbs_g: 2.0, fat_g: 1.0, cholesterol_mg: 15, water_oz: 16, image_key: "whey_shake", is_estimated: false }
    ]);

    await prisma.$executeRawUnsafe(
      `INSERT INTO meal_plans (plan_name, window_label, scheduled_time, items, is_active)
       VALUES 
       ('Active Cut Protocol', 'Morning Pre-Fast Window (Before 12:00 PM)', '10:30 AM', $1::jsonb, true),
       ('Active Cut Protocol', 'Evening Post-Fast Window (After 6:00 PM)', '6:30 PM', $2::jsonb, true);`,
      preFastItems,
      postFastItems
    );
    console.log("Default active meal plans seeded.");
  }

  console.log("Historical & default seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
