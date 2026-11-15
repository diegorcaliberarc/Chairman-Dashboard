const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCommandMigrations() {
  console.log('Starting Command & Telemetry Engine Database Migration...');

  const statements = [
    // 1. Enums
    `DO $$ BEGIN CREATE TYPE life_domain AS ENUM ('health', 'wealth', 'relationships', 'happiness'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE sequence_type AS ENUM ('bottleneck', 'tag_team'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE pace_tier AS ENUM ('primary', 'alternate', 'contingency', 'emergency'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE sitrep_grade AS ENUM ('pass', 'partial', 'miss'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE scorecard_grade AS ENUM ('A', 'B', 'C', 'D', 'F'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE failure_classification AS ENUM ('planning', 'execution', 'adversity', 'drift', 'unforeseen'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

    // 2. command_north_stars
    `CREATE TABLE IF NOT EXISTS public.command_north_stars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      domain life_domain NOT NULL,
      title TEXT NOT NULL,
      vision_statement TEXT NOT NULL,
      target_metric_label TEXT NOT NULL,
      target_metric_value NUMERIC NOT NULL,
      current_metric_value NUMERIC NOT NULL DEFAULT 0,
      metric_unit TEXT NOT NULL,
      target_date DATE,
      cover_image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, domain)
    );`,

    // 3. command_phases
    `CREATE TABLE IF NOT EXISTS public.command_phases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      north_star_id UUID NOT NULL REFERENCES public.command_north_stars(id) ON DELETE CASCADE,
      phase_number INT NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      status phase_status NOT NULL DEFAULT 'not_started',
      sequence_type sequence_type NOT NULL DEFAULT 'bottleneck',
      target_completion_date DATE,
      reference_strips JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 4. command_fragos
    `CREATE TABLE IF NOT EXISTS public.command_fragos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      domain life_domain NOT NULL,
      week_start_date DATE NOT NULL,
      situation TEXT NOT NULL DEFAULT '',
      mission TEXT NOT NULL DEFAULT '',
      execution TEXT NOT NULL DEFAULT '',
      sustainment TEXT NOT NULL DEFAULT '',
      command_signal TEXT NOT NULL DEFAULT '',
      active_pace_tier pace_tier NOT NULL DEFAULT 'primary',
      pace_plans JSONB NOT NULL DEFAULT '{"primary": "", "alternate": "", "contingency": "", "emergency": ""}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, domain, week_start_date)
    );`,

    // 5. daily_sitrep_logs
    `CREATE TABLE IF NOT EXISTS public.daily_sitrep_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      log_date DATE NOT NULL,
      morning_weight_lbs NUMERIC(5,2),
      moving_avg_7d_lbs NUMERIC(5,2),
      total_steps INT NOT NULL DEFAULT 0,
      miles NUMERIC(5,2) GENERATED ALWAYS AS (ROUND(total_steps / 2100.0, 2)) STORED,
      calories_eaten INT NOT NULL DEFAULT 0,
      kcal_burned INT NOT NULL DEFAULT 0,
      kcal_deficit INT GENERATED ALWAYS AS (kcal_burned - calories_eaten) STORED,
      protein_g NUMERIC(5,1) NOT NULL DEFAULT 0,
      water_oz NUMERIC(5,1) NOT NULL DEFAULT 0,
      sleep_hours NUMERIC(4,2),
      recovery_score INT,
      lift_completed BOOLEAN NOT NULL DEFAULT FALSE,
      cardio_completed BOOLEAN NOT NULL DEFAULT FALSE,
      fasting_hours NUMERIC(4,2),
      sitrep_grade sitrep_grade NOT NULL DEFAULT 'miss',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, log_date)
    );`,

    // 6. command_aar_logs
    `CREATE TABLE IF NOT EXISTS public.command_aar_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      week_start_date DATE NOT NULL,
      domain life_domain NOT NULL,
      audited_grade scorecard_grade NOT NULL DEFAULT 'B',
      what_happened TEXT NOT NULL,
      what_went_wrong TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      failure_classification failure_classification NOT NULL DEFAULT 'execution',
      lessons_learned TEXT NOT NULL,
      actionable_fix TEXT NOT NULL,
      pms_tasks_created JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // 7. Indexes
    `CREATE INDEX IF NOT EXISTS idx_sitrep_user_date ON public.daily_sitrep_logs(user_id, log_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_command_phases_north_star ON public.command_phases(north_star_id, phase_number);`,
    `CREATE INDEX IF NOT EXISTS idx_command_fragos_user_domain_date ON public.command_fragos(user_id, domain, week_start_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_command_aar_user_domain_date ON public.command_aar_logs(user_id, domain, week_start_date DESC);`,

    // 8. Trigger function
    `CREATE OR REPLACE FUNCTION compute_sitrep_moving_avg_and_grade()
    RETURNS TRIGGER AS $$
    DECLARE
      v_avg NUMERIC(5,2);
      v_deficit INT;
      v_criteria_met INT := 0;
    BEGIN
      IF NEW.morning_weight_lbs IS NOT NULL THEN
        SELECT ROUND(AVG(weight_val)::numeric, 2)
        INTO v_avg
        FROM (
          SELECT NEW.morning_weight_lbs AS weight_val
          UNION ALL
          SELECT morning_weight_lbs AS weight_val
          FROM public.daily_sitrep_logs
          WHERE user_id = NEW.user_id
            AND log_date < NEW.log_date
            AND log_date >= (NEW.log_date - INTERVAL '6 days')
            AND morning_weight_lbs IS NOT NULL
            AND (TG_OP = 'INSERT' OR id <> NEW.id)
          LIMIT 6
        ) t;
        NEW.moving_avg_7d_lbs := v_avg;
      ELSE
        NEW.moving_avg_7d_lbs := NULL;
      END IF;

      v_deficit := COALESCE(NEW.kcal_burned, 0) - COALESCE(NEW.calories_eaten, 0);

      IF v_deficit >= 350 THEN
        v_criteria_met := v_criteria_met + 1;
      END IF;

      IF COALESCE(NEW.protein_g, 0) >= 140 THEN
        v_criteria_met := v_criteria_met + 1;
      END IF;

      IF COALESCE(NEW.total_steps, 0) >= 8000 THEN
        v_criteria_met := v_criteria_met + 1;
      END IF;

      IF v_criteria_met = 3 THEN
        NEW.sitrep_grade := 'pass'::sitrep_grade;
      ELSIF v_criteria_met >= 1 THEN
        NEW.sitrep_grade := 'partial'::sitrep_grade;
      ELSE
        NEW.sitrep_grade := 'miss'::sitrep_grade;
      END IF;

      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,

    // 9. Attach trigger
    `DROP TRIGGER IF EXISTS trg_sitrep_moving_avg_and_grade ON public.daily_sitrep_logs;`,
    `CREATE TRIGGER trg_sitrep_moving_avg_and_grade
    BEFORE INSERT OR UPDATE ON public.daily_sitrep_logs
    FOR EACH ROW
    EXECUTE FUNCTION compute_sitrep_moving_avg_and_grade();`,

    // 10. Enable Row Level Security
    `ALTER TABLE public.command_north_stars ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.command_phases ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.command_fragos ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.daily_sitrep_logs ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.command_aar_logs ENABLE ROW LEVEL SECURITY;`,

    // 11. RLS Policies
    `DO $$ BEGIN CREATE POLICY "Users can manage own north stars" ON public.command_north_stars FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE POLICY "Users can manage own command phases" ON public.command_phases FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE POLICY "Users can manage own command fragos" ON public.command_fragos FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE POLICY "Users can manage own sitrep logs" ON public.daily_sitrep_logs FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE POLICY "Users can manage own aar logs" ON public.command_aar_logs FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $$;`
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[${i + 1}/${statements.length}] Executed successfully.`);
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err.message);
      throw err;
    }
  }

  console.log('✅ Command & Telemetry Engine Database Migration Completed Successfully!');
}

runCommandMigrations()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
