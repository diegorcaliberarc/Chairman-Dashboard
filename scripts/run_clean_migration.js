const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const statements = [
  // 1. Types
  `DO $$ BEGIN CREATE TYPE calendar_category_enum AS ENUM ('work', 'workout', 'personal', 'pms_task', 'google_sync'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE muscle_group_enum AS ENUM ('chest', 'back', 'shoulders', 'arms', 'legs', 'abs', 'cardio'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE workout_status_enum AS ENUM ('scheduled', 'in_progress', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE pms_priority_enum AS ENUM ('urgent', 'high', 'normal', 'low', 'none'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE pms_status_category_enum AS ENUM ('not_started', 'active', 'done', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE pms_dependency_enum AS ENUM ('blocking', 'waiting_on', 'linked'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // 2. User targets & logs
  `CREATE TABLE IF NOT EXISTS public.user_macro_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    target_calories INT NOT NULL DEFAULT 2000,
    target_protein_g NUMERIC(5,1) NOT NULL DEFAULT 150.0,
    target_carbs_g NUMERIC(5,1) NOT NULL DEFAULT 200.0,
    target_fats_g NUMERIC(5,1) NOT NULL DEFAULT 65.0,
    target_water_oz NUMERIC(5,1) NOT NULL DEFAULT 100.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.daily_macro_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_name TEXT NOT NULL,
    calories INT NOT NULL DEFAULT 0,
    protein_g NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    carbs_g NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    fats_g NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    water_oz NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    body_weight_lbs NUMERIC(4,1),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_daily_macro_logs_user_date ON public.daily_macro_logs(user_id, log_date);`,

  `CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    sync_token TEXT,
    channel_id TEXT,
    resource_id TEXT,
    expiration TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
  );`,

  // 3. Titan Workouts
  `CREATE TABLE IF NOT EXISTS public.titan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group muscle_group_enum NOT NULL,
    equipment TEXT,
    default_sets INT NOT NULL DEFAULT 3,
    default_reps INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.titan_workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    split_name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.titan_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.titan_workout_templates(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    status workout_status_enum NOT NULL DEFAULT 'scheduled',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_volume_lbs NUMERIC(10,2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_titan_sessions_user_date ON public.titan_workout_sessions(user_id, scheduled_date);`,

  `CREATE TABLE IF NOT EXISTS public.titan_set_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.titan_workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.titan_exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps INT NOT NULL DEFAULT 0,
    weight_lbs NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    rpe NUMERIC(3,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_titan_set_logs_session ON public.titan_set_logs(session_id);`,

  // 4. PMS Infrastructure
  `CREATE TABLE IF NOT EXISTS public.pms_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.pms_workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT DEFAULT '#7C3AED',
    icon TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.pms_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_lists_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.pms_spaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.pms_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.pms_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category pms_status_category_enum NOT NULL DEFAULT 'active',
    color_hex TEXT NOT NULL DEFAULT '#64748B',
    sort_order INT NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_tasks_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.pms_lists_v2(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status_id UUID REFERENCES public.pms_statuses(id) ON DELETE SET NULL,
    priority pms_priority_enum NOT NULL DEFAULT 'none',
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    time_estimate_ms BIGINT DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_pms_tasks_v2_list ON public.pms_tasks_v2(list_id);`,
  `CREATE INDEX IF NOT EXISTS idx_pms_tasks_v2_due_date ON public.pms_tasks_v2(due_date);`,

  // 5. Calendar Events
  `CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_event_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    category calendar_category_enum NOT NULL DEFAULT 'personal',
    workout_template_id UUID REFERENCES public.titan_workout_templates(id) ON DELETE SET NULL,
    pms_task_id UUID REFERENCES public.pms_tasks_v2(id) ON DELETE SET NULL,
    color_hex TEXT NOT NULL DEFAULT '#0969DA',
    recurrence_rule TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_calendar_events_user_range ON public.calendar_events(user_id, start_time, end_time);`,

  // 6. Remaining PMS Sub-tables
  `CREATE TABLE IF NOT EXISTS public.pms_task_assignees (
    task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY(task_id, user_id)
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.pms_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_task_custom_field_values (
    task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.pms_custom_fields(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    PRIMARY KEY(task_id, field_id)
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    prerequisite_task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    type pms_dependency_enum NOT NULL DEFAULT 'blocking'
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.pms_tasks_v2(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_ms BIGINT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS public.pms_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.pms_spaces(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    condition_payload JSONB,
    action_type TEXT NOT NULL,
    action_payload JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // 7. Enable RLS
  `ALTER TABLE public.user_macro_targets ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.daily_macro_logs ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.titan_exercises ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.titan_workout_templates ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.titan_workout_sessions ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.titan_set_logs ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_workspaces ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_spaces ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_folders ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_lists_v2 ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_statuses ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_tasks_v2 ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_task_assignees ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_custom_fields ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_task_custom_field_values ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_task_dependencies ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_task_comments ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_time_entries ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pms_automations ENABLE ROW LEVEL SECURITY;`,

  // 8. RLS Policies
  `DROP POLICY IF EXISTS "user_macro_targets_policy" ON public.user_macro_targets;`,
  `CREATE POLICY "user_macro_targets_policy" ON public.user_macro_targets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "daily_macro_logs_policy" ON public.daily_macro_logs;`,
  `CREATE POLICY "daily_macro_logs_policy" ON public.daily_macro_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "user_integrations_policy" ON public.user_integrations;`,
  `CREATE POLICY "user_integrations_policy" ON public.user_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "calendar_events_policy" ON public.calendar_events;`,
  `CREATE POLICY "calendar_events_policy" ON public.calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "titan_exercises_policy" ON public.titan_exercises;`,
  `CREATE POLICY "titan_exercises_policy" ON public.titan_exercises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "titan_workout_templates_policy" ON public.titan_workout_templates;`,
  `CREATE POLICY "titan_workout_templates_policy" ON public.titan_workout_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "titan_workout_sessions_policy" ON public.titan_workout_sessions;`,
  `CREATE POLICY "titan_workout_sessions_policy" ON public.titan_workout_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "titan_set_logs_policy" ON public.titan_set_logs;`,
  `CREATE POLICY "titan_set_logs_policy" ON public.titan_set_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.titan_workout_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.titan_workout_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_workspaces_policy" ON public.pms_workspaces;`,
  `CREATE POLICY "pms_workspaces_policy" ON public.pms_workspaces FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);`,

  `DROP POLICY IF EXISTS "pms_spaces_policy" ON public.pms_spaces;`,
  `CREATE POLICY "pms_spaces_policy" ON public.pms_spaces FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_folders_policy" ON public.pms_folders;`,
  `CREATE POLICY "pms_folders_policy" ON public.pms_folders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_lists_v2_policy" ON public.pms_lists_v2;`,
  `CREATE POLICY "pms_lists_v2_policy" ON public.pms_lists_v2 FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id 
        WHERE (s.id = space_id OR s.id = (SELECT f.space_id FROM public.pms_folders f WHERE f.id = folder_id)) AND w.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id 
        WHERE (s.id = space_id OR s.id = (SELECT f.space_id FROM public.pms_folders f WHERE f.id = folder_id)) AND w.owner_id = auth.uid()
    )
  );`,

  `DROP POLICY IF EXISTS "pms_statuses_policy" ON public.pms_statuses;`,
  `CREATE POLICY "pms_statuses_policy" ON public.pms_statuses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_tasks_v2_policy" ON public.pms_tasks_v2;`,
  `CREATE POLICY "pms_tasks_v2_policy" ON public.pms_tasks_v2 FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);`,

  `DROP POLICY IF EXISTS "pms_task_assignees_policy" ON public.pms_task_assignees;`,
  `CREATE POLICY "pms_task_assignees_policy" ON public.pms_task_assignees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "pms_custom_fields_policy" ON public.pms_custom_fields;`,
  `CREATE POLICY "pms_custom_fields_policy" ON public.pms_custom_fields FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_task_custom_field_values_policy" ON public.pms_task_custom_field_values;`,
  `CREATE POLICY "pms_task_custom_field_values_policy" ON public.pms_task_custom_field_values FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_tasks_v2 t WHERE t.id = task_id AND t.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_tasks_v2 t WHERE t.id = task_id AND t.created_by = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_task_dependencies_policy" ON public.pms_task_dependencies;`,
  `CREATE POLICY "pms_task_dependencies_policy" ON public.pms_task_dependencies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_tasks_v2 t WHERE t.id = dependent_task_id AND t.created_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_tasks_v2 t WHERE t.id = dependent_task_id AND t.created_by = auth.uid())
  );`,

  `DROP POLICY IF EXISTS "pms_task_comments_policy" ON public.pms_task_comments;`,
  `CREATE POLICY "pms_task_comments_policy" ON public.pms_task_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "pms_time_entries_policy" ON public.pms_time_entries;`,
  `CREATE POLICY "pms_time_entries_policy" ON public.pms_time_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,

  `DROP POLICY IF EXISTS "pms_automations_policy" ON public.pms_automations;`,
  `CREATE POLICY "pms_automations_policy" ON public.pms_automations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.pms_spaces s JOIN public.pms_workspaces w ON w.id = s.workspace_id WHERE s.id = space_id AND w.owner_id = auth.uid())
  );`
];

async function run() {
  console.log('Running ' + statements.length + ' clean schema statements...');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i].trim();
    try {
      await prisma.$executeRawUnsafe(sql);
      successCount++;
    } catch (err) {
      errorCount++;
      console.error('Failed stmt ' + (i + 1) + ':\n' + sql);
      console.error('Error:', err.message);
    }
  }

  console.log('\nMigration complete: ' + successCount + ' succeeded, ' + errorCount + ' failed.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

