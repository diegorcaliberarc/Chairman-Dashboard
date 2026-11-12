const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Running migration for nutrition tables...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      log_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
      morning_weight_lbs NUMERIC(5,2),
      steps_count INTEGER DEFAULT 0,
      calorie_target INTEGER DEFAULT 1700,
      protein_target_g INTEGER DEFAULT 180,
      cholesterol_cap_mg INTEGER DEFAULT 255,
      water_target_oz INTEGER DEFAULT 128,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("daily_logs table verified.");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      log_date DATE NOT NULL REFERENCES daily_logs(log_date) ON DELETE CASCADE,
      meal_window TEXT DEFAULT 'unassigned',
      raw_input TEXT,
      name TEXT NOT NULL,
      quantity_grams NUMERIC(7,1) NOT NULL,
      weight_lbs NUMERIC(5,2) NOT NULL,
      calories INTEGER NOT NULL,
      protein_g NUMERIC(6,1) NOT NULL,
      carbs_g NUMERIC(6,1) NOT NULL,
      fat_g NUMERIC(6,1) NOT NULL,
      cholesterol_mg INTEGER DEFAULT 0,
      water_oz NUMERIC(6,1) DEFAULT 0,
      image_key TEXT NOT NULL DEFAULT 'default_food',
      is_estimated BOOLEAN DEFAULT FALSE,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("food_entries table verified.");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_name TEXT NOT NULL DEFAULT 'Active Cut Protocol',
      window_label TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      items JSONB NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("meal_plans table verified.");

  console.log("Migration executed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
