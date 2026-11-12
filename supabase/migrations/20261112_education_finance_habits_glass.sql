-- ============================================================================
-- Chairman Dashboard — Education Master Curriculum, Calendar Financial/Habits,
-- 12-Month Budget, Marketing/Gaming Scrubber, KPI Scorecard & Liquid Glass UI
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Gamified Furthering Education Department
CREATE TABLE IF NOT EXISTS education_user_profile (
  user_id TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  rank_title TEXT NOT NULL DEFAULT 'Zero-Code Orchestrator',
  streak_days INTEGER NOT NULL DEFAULT 1,
  last_studied_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education_class_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  class_slug TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'beginner',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  quiz_score INTEGER NOT NULL DEFAULT 0,
  quiz_total INTEGER NOT NULL DEFAULT 3,
  lab_completed BOOLEAN NOT NULL DEFAULT FALSE,
  adr_notes TEXT NOT NULL DEFAULT '',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, class_slug)
);

CREATE INDEX IF NOT EXISTS idx_edu_progress_user ON education_class_progress(user_id);

CREATE TABLE IF NOT EXISTS education_xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  xp_delta INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_xp_user ON education_xp_ledger(user_id, created_at DESC);

-- 2. Calendar Full-Circle Habit Tracker, Highlight Spans, Shifts & Year Appointments
CREATE TABLE IF NOT EXISTS calendar_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT 'Weight-loss daily walk target',
  unit TEXT NOT NULL DEFAULT 'steps',
  target_value NUMERIC(12,2) NOT NULL DEFAULT 10000,
  ring_color TEXT NOT NULL DEFAULT '#10b981',
  icon_name TEXT NOT NULL DEFAULT 'footprints',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_habits_user ON calendar_habits(user_id);

CREATE TABLE IF NOT EXISTS calendar_habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  habit_id UUID NOT NULL REFERENCES calendar_habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_cal_habit_logs_date ON calendar_habit_logs(user_id, log_date);

CREATE TABLE IF NOT EXISTS calendar_highlight_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  span_type TEXT NOT NULL DEFAULT 'hours', -- 'hours' | 'multi_day'
  start_minute INTEGER NOT NULL DEFAULT 420, -- e.g. 07:00
  end_minute INTEGER NOT NULL DEFAULT 960,   -- e.g. 16:00
  start_date DATE,
  end_date DATE,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  opacity NUMERIC(4,2) NOT NULL DEFAULT 0.22,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_highlights_user ON calendar_highlight_spans(user_id);

CREATE TABLE IF NOT EXISTS work_shift_configs (
  user_id TEXT PRIMARY KEY,
  role_label TEXT NOT NULL DEFAULT 'Primary Shift / Contract Ops',
  pay_per_shift NUMERIC(12,2) NOT NULL DEFAULT 320.00,
  hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 40.00,
  hours_per_shift NUMERIC(6,2) NOT NULL DEFAULT 8.00,
  total_scheduled_days INTEGER NOT NULL DEFAULT 22,
  shifts_per_week NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  work_date DATE NOT NULL,
  shifts_count NUMERIC(6,2) NOT NULL DEFAULT 1.00,
  pay_rate_override NUMERIC(12,2),
  anticipated_pay NUMERIC(12,2) NOT NULL DEFAULT 320.00,
  actual_pay NUMERIC(12,2) NOT NULL DEFAULT 320.00,
  daily_expense NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'worked', -- 'worked' | 'scheduled' | 'off'
  notes TEXT DEFAULT '',
  subtask_style TEXT NOT NULL DEFAULT 'roman', -- 'roman' | 'bullets'
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_shift_logs_user_date ON work_shift_logs(user_id, work_date);

CREATE TABLE IF NOT EXISTS yearly_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'work', -- 'work' | 'client' | 'medical' | 'personal' | 'financial'
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '07:00',
  end_time TEXT NOT NULL DEFAULT '08:00',
  accent_color TEXT NOT NULL DEFAULT '#38bdf8',
  daily_money_used NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  anticipated_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  actual_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtask_style TEXT NOT NULL DEFAULT 'roman', -- 'roman' | 'bullets'
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yearly_appts_user_date ON yearly_appointments(user_id, appointment_date);

-- Additive columns on CircadianChecklist / CircadianEvent if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CircadianEvent') THEN
    ALTER TABLE "CircadianEvent" ADD COLUMN IF NOT EXISTS "subtaskStyle" TEXT DEFAULT 'roman';
    ALTER TABLE "CircadianEvent" ADD COLUMN IF NOT EXISTS "dailyMoneyUsed" DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE "CircadianEvent" ADD COLUMN IF NOT EXISTS "anticipatedPay" DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE "CircadianEvent" ADD COLUMN IF NOT EXISTS "actualPay" DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE "CircadianEvent" ADD COLUMN IF NOT EXISTS "isHighlightedSpan" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Connected 12-Month Budget Tracker
CREATE TABLE IF NOT EXISTS budget_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  budget_year INTEGER NOT NULL DEFAULT 2026,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  income_target NUMERIC(12,2) NOT NULL DEFAULT 8500.00,
  expense_cap NUMERIC(12,2) NOT NULL DEFAULT 4200.00,
  savings_target NUMERIC(12,2) NOT NULL DEFAULT 2500.00,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, budget_year, budget_month)
);

CREATE TABLE IF NOT EXISTS budget_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  budget_year INTEGER NOT NULL DEFAULT 2026,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL DEFAULT 'expense', -- 'income' | 'expense' | 'savings'
  category TEXT NOT NULL DEFAULT 'Operations',
  label TEXT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  linked_source TEXT DEFAULT 'manual', -- 'manual' | 'shift' | 'appointment' | 'life_ops'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_entries_ym ON budget_entries(user_id, budget_year, budget_month);

-- 4. Marketing & Gaming Trend-Scrubbing Intelligence Agent
CREATE TABLE IF NOT EXISTS marketing_intel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stream TEXT NOT NULL DEFAULT 'marketing', -- 'marketing' | 'gaming'
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'YouTube / X',
  hook_angle TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 88,
  velocity_tag TEXT NOT NULL DEFAULT 'Breakout +240%',
  summary TEXT NOT NULL DEFAULT '',
  actionable_playbook JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url TEXT DEFAULT '',
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  pushed_to_pms BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_intel_user ON marketing_intel_items(user_id, stream, created_at DESC);

-- 5. KPI Scorecard Tracker Snapshots
CREATE TABLE IF NOT EXISTS kpi_scorecard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cadence TEXT NOT NULL DEFAULT 'weekly', -- 'daily' | 'weekly' | 'monthly'
  overall_score INTEGER NOT NULL DEFAULT 85,
  grade TEXT NOT NULL DEFAULT 'A-',
  green_count INTEGER NOT NULL DEFAULT 0,
  yellow_count INTEGER NOT NULL DEFAULT 0,
  red_count INTEGER NOT NULL DEFAULT 0,
  sector_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  executive_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date, cadence)
);

CREATE INDEX IF NOT EXISTS idx_kpi_scorecard_user ON kpi_scorecard_snapshots(user_id, snapshot_date DESC);

-- 6. User UI & Liquid Glassmorphism + Pixel-Pals Preferences
CREATE TABLE IF NOT EXISTS user_ui_preferences (
  user_id TEXT PRIMARY KEY,
  glass_preset TEXT NOT NULL DEFAULT 'northpeak-dark',
  color_mode TEXT NOT NULL DEFAULT 'dark',
  wheel_stops JSONB NOT NULL DEFAULT '[{"id":"s1","hue":218,"sat":88,"light":60,"hex":"#3b82f6"},{"id":"s2","hue":268,"sat":84,"light":64,"hex":"#8b5cf6"},{"id":"s3","hue":190,"sat":90,"light":54,"hex":"#06b6d4"}]'::jsonb,
  grad_angle INTEGER NOT NULL DEFAULT 135,
  glass_blur INTEGER NOT NULL DEFAULT 24,
  glass_opacity NUMERIC(4,2) NOT NULL DEFAULT 0.62,
  pals_visible BOOLEAN NOT NULL DEFAULT TRUE,
  pals_scenario TEXT NOT NULL DEFAULT 'auto',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

