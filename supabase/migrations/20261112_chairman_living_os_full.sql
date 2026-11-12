-- ============================================================================
-- CHAIRMAN DASHBOARD (LIVING OS) — MASTER DATABASE MIGRATION (SECTIONS 9–23)
-- PostgreSQL / Supabase Zero-Trust RLS + NextAuth Compatible
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Section 9: Nutrition & Metabolic Engine (MacroOps) ─────────────────────
CREATE TABLE IF NOT EXISTS public.nutrition_daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    date DATE NOT NULL,
    calorie_preset VARCHAR(32) DEFAULT '1750_training',
    target_calories INT NOT NULL DEFAULT 1750,
    target_protein INT NOT NULL DEFAULT 180,
    target_carbs INT NOT NULL DEFAULT 140,
    target_fats INT NOT NULL DEFAULT 52,
    target_sodium_mg INT NOT NULL DEFAULT 2300,
    consumed_calories INT DEFAULT 0,
    consumed_protein INT DEFAULT 0,
    consumed_carbs INT DEFAULT 0,
    consumed_fats INT DEFAULT 0,
    consumed_sodium_mg INT DEFAULT 0,
    total_water_fl_oz NUMERIC(6,2) DEFAULT 0,
    total_weight_consumed_lbs NUMERIC(6,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.nutrition_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID REFERENCES public.nutrition_daily_logs(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    meal_slot VARCHAR(32) DEFAULT 'Meal 1',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calories INT NOT NULL,
    protein_g NUMERIC(6,1) NOT NULL,
    carbs_g NUMERIC(6,1) NOT NULL,
    fats_g NUMERIC(6,1) NOT NULL,
    sodium_mg INT DEFAULT 0,
    weight_g NUMERIC(7,1) NOT NULL,
    food_items JSONB DEFAULT '[]'::jsonb
);

-- ─── Section 10: Caliber Arc (Futures Trading Terminal) ─────────────────────
DO $$ BEGIN
    CREATE TYPE public.trade_direction AS ENUM ('LONG', 'SHORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.trade_instrument AS ENUM ('NQ', 'MNQ', 'ES', 'MES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.trading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    session_date DATE NOT NULL,
    account_name VARCHAR(64) NOT NULL,
    starting_balance NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
    ending_balance NUMERIC(12,2),
    daily_net_pnl NUMERIC(10,2) DEFAULT 0,
    max_drawdown_limit NUMERIC(10,2) DEFAULT 2000.00,
    session_loss_cutoff NUMERIC(10,2) DEFAULT 250.00,
    circuit_breaker_tripped BOOLEAN DEFAULT FALSE,
    copier_status VARCHAR(32) DEFAULT 'Replikanto Synced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trading_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.trading_sessions(id) ON DELETE CASCADE NOT NULL,
    instrument public.trade_instrument NOT NULL DEFAULT 'MNQ',
    direction public.trade_direction NOT NULL DEFAULT 'LONG',
    contracts INT NOT NULL DEFAULT 1,
    entry_price NUMERIC(10,2) NOT NULL,
    exit_price NUMERIC(10,2) NOT NULL,
    stop_loss_ticks INT DEFAULT 200,
    take_profit_ticks INT DEFAULT 400,
    entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gross_pnl NUMERIC(10,2) NOT NULL,
    commissions NUMERIC(8,2) DEFAULT 4.00,
    net_pnl NUMERIC(10,2) NOT NULL,
    setup_name VARCHAR(64),
    market_add_at_entry NUMERIC(6,1),
    cvd_direction VARCHAR(16),
    leader_alignment VARCHAR(64),
    notes TEXT
);

-- ─── Section 11: Autonomous MCP Mesh & Vault Connectors ─────────────────────
CREATE TABLE IF NOT EXISTS public.mcp_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    provider_key VARCHAR(64) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    endpoint_url TEXT,
    vault_secret_masked VARCHAR(64),
    status VARCHAR(32) DEFAULT 'connected',
    last_latency_ms INT DEFAULT 12,
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    capabilities JSONB DEFAULT '[]'::jsonb,
    UNIQUE(user_id, provider_key)
);

-- ─── Section 12: Sovereign PMS & ClickUp Ingestion Engine ───────────────────
DO $$ BEGIN
    CREATE TYPE public.pms_status_category AS ENUM ('open', 'unstarted', 'active', 'review', 'blocked', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.pms_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    name VARCHAR(120) NOT NULL,
    space_name VARCHAR(120) DEFAULT 'Executive Operations',
    original_clickup_list_id VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pms_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    list_id UUID REFERENCES public.pms_lists(id) ON DELETE CASCADE NOT NULL,
    parent_task_id UUID REFERENCES public.pms_tasks(id) ON DELETE SET NULL,
    original_clickup_id VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    markdown_description TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'to do',
    status_category public.pms_status_category NOT NULL DEFAULT 'unstarted',
    priority VARCHAR(16) DEFAULT 'normal',
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    time_estimate_minutes INT DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_shared BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pms_task_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.pms_tasks(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pms_tasks_user_status ON public.pms_tasks (user_id, status_category);
CREATE INDEX IF NOT EXISTS idx_pms_tasks_dates ON public.pms_tasks (user_id, start_date, due_date);

-- ─── Section 13: "His & Hers" Shared Pod Engine ─────────────────────────────
DO $$ BEGIN
    CREATE TYPE public.pod_type_enum AS ENUM ('couple', 'family', 'business_team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.pod_member_role AS ENUM ('owner', 'partner', 'admin', 'member', 'dependent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.shared_pods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    pod_type public.pod_type_enum NOT NULL DEFAULT 'couple',
    owner_id TEXT,
    max_members INT DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pod_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID REFERENCES public.shared_pods(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT NOT NULL,
    role public.pod_member_role NOT NULL DEFAULT 'member',
    display_alias VARCHAR(64),
    avatar_url TEXT,
    active_streak_days INT DEFAULT 14,
    today_completed_tasks_count INT DEFAULT 4,
    today_workout_completed BOOLEAN DEFAULT TRUE,
    current_status VARCHAR(120),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pod_consent_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID REFERENCES public.shared_pods(id) ON DELETE CASCADE NOT NULL,
    grantor_user_id TEXT NOT NULL,
    grantee_user_id TEXT NOT NULL,
    share_finances BOOLEAN DEFAULT FALSE,
    share_finance_transactions BOOLEAN DEFAULT FALSE,
    share_pms_tasks BOOLEAN DEFAULT FALSE,
    share_all_tasks BOOLEAN DEFAULT FALSE,
    share_calendar_events BOOLEAN DEFAULT TRUE,
    share_calendar_details BOOLEAN DEFAULT FALSE,
    share_nutrition_macros BOOLEAN DEFAULT FALSE,
    share_biometrics_workouts BOOLEAN DEFAULT TRUE,
    share_biometrics_health_stats BOOLEAN DEFAULT FALSE,
    share_trading_summary BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_id, grantor_user_id, grantee_user_id)
);

-- ─── Section 14: The Neural Vault (Obsidian Graph & Knowledge Base) ─────────
CREATE TABLE IF NOT EXISTS public.vault_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL DEFAULT '',
    domain VARCHAR(64) DEFAULT 'engineering',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vault_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    source_node_id UUID REFERENCES public.vault_nodes(id) ON DELETE CASCADE NOT NULL,
    target_node_id UUID REFERENCES public.vault_nodes(id) ON DELETE CASCADE NOT NULL,
    link_type VARCHAR(32) DEFAULT 'wikilink',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_node_id, target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_vault_nodes_user_slug ON public.vault_nodes (user_id, slug);
CREATE INDEX IF NOT EXISTS idx_vault_links_source ON public.vault_links (source_node_id);
CREATE INDEX IF NOT EXISTS idx_vault_links_target ON public.vault_links (target_node_id);

-- ─── Section 15: Daily Life, Household & Logistics Engine (LifeOps) ─────────
DO $$ BEGIN
    CREATE TYPE public.logistics_category AS ENUM ('culinary', 'household_cleaning', 'property_maintenance', 'vehicle_fleet', 'travel', 'appointment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.life_logistics_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    category public.logistics_category NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    schedule_interval VARCHAR(32),
    interval_value INT DEFAULT 1,
    last_completed_at TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ,
    telemetry_metric VARCHAR(32),
    current_metric_reading NUMERIC(10,2),
    threshold_metric_due NUMERIC(10,2),
    checklist_items JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_logistics_user_cat_due ON public.life_logistics_items (user_id, category, next_due_date);

-- ─── Section 16: Multi-Entity Circadian Command Hub (5-Wheel Matrix) ────────
DO $$ BEGIN
    CREATE TYPE public.entity_type_enum AS ENUM ('human_adult', 'human_child', 'canine_senior', 'canine_adult');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.household_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    name VARCHAR(64) NOT NULL,
    entity_type public.entity_type_enum NOT NULL,
    avatar_url TEXT,
    accent_color VARCHAR(9) DEFAULT '#2563eb',
    daily_water_target_oz NUMERIC(6,2) DEFAULT 64.00,
    daily_food_target_grams NUMERIC(6,1) DEFAULT 400.0,
    special_care_notes TEXT,
    schedule_blocks JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entity_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES public.household_entities(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    water_consumed_oz NUMERIC(6,2) DEFAULT 0,
    food_consumed_grams NUMERIC(6,1) DEFAULT 0,
    potty_walk_completed BOOLEAN DEFAULT FALSE,
    medication_administered BOOLEAN DEFAULT FALSE,
    medication_name VARCHAR(120),
    activity_minutes INT DEFAULT 0,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_household_entities_user ON public.household_entities (user_id);
CREATE INDEX IF NOT EXISTS idx_entity_telemetry_entity_date ON public.entity_telemetry_logs (entity_id, log_date);

-- ─── Section 17: Sovereign Multimodal AI Copilot Audit & Telemetry ──────────
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    title VARCHAR(160) DEFAULT 'New Operational Briefing',
    session_mode VARCHAR(32) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copilot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_role VARCHAR(16) NOT NULL,
    content TEXT,
    audio_transcript TEXT,
    media_attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copilot_tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE CASCADE NOT NULL,
    tool_name VARCHAR(120) NOT NULL,
    tool_arguments JSONB NOT NULL,
    tool_result JSONB,
    execution_duration_ms INT,
    status VARCHAR(32) DEFAULT 'success',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_messages_convo ON public.copilot_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_copilot_tool_audit ON public.copilot_tool_executions (conversation_id, executed_at);

-- ─── Section 18: Circadian Radar Filter Layer Engine ────────────────────────
DO $$ BEGIN
    CREATE TYPE public.radar_layer_type AS ENUM ('energy_forecast', 'activity_density', 'posture_biometrics', 'metabolic_burn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.circadian_radar_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    date DATE NOT NULL,
    layer_type public.radar_layer_type NOT NULL,
    time_bucket_minutes INT DEFAULT 15,
    bucket_values JSONB NOT NULL,
    peak_start_time TIMESTAMPTZ,
    peak_end_time TIMESTAMPTZ,
    trough_start_time TIMESTAMPTZ,
    trough_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, layer_type)
);

CREATE INDEX IF NOT EXISTS idx_radar_layers_user_date ON public.circadian_radar_layers (user_id, date, layer_type);

-- ─── Section 20: Strategic Epistemic Planning Matrix ────────────────────────
DO $$ BEGIN
    CREATE TYPE public.epistemic_category AS ENUM ('known_known', 'unknown_known', 'unknown_unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.epistemic_impact AS ENUM ('tactical', 'operational', 'existential');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.epistemic_planning_matrices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    entity_id VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL DEFAULT 'project',
    title VARCHAR(160) NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.epistemic_matrix_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matrix_id UUID REFERENCES public.epistemic_planning_matrices(id) ON DELETE CASCADE NOT NULL,
    category public.epistemic_category NOT NULL,
    impact public.epistemic_impact NOT NULL DEFAULT 'operational',
    claim_statement TEXT NOT NULL,
    validation_protocol TEXT,
    is_mitigated BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epistemic_matrix_entity ON public.epistemic_planning_matrices (user_id, entity_id);

-- ─── Section 21 & 22: Macro Horizon Roadmapping, Semantic Zoom & Journey ────
DO $$ BEGIN
    CREATE TYPE public.horizon_tier_enum AS ENUM ('1_year', '10_year', '30_year', '80_year');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.waypoint_terrain_type AS ENUM ('summit_peak', 'valley_station', 'river_crossing', 'coastal_harbor', 'citadel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.macro_horizon_pillars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    ray_angle_degrees NUMERIC(5,2) NOT NULL,
    accent_color VARCHAR(9) DEFAULT '#f59e0b',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.macro_horizon_slivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pillar_id UUID REFERENCES public.macro_horizon_pillars(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT,
    horizon_tier public.horizon_tier_enum NOT NULL,
    title VARCHAR(160) NOT NULL,
    strategic_intent TEXT,
    target_year INT NOT NULL,
    resource_weight_pct INT CHECK (resource_weight_pct BETWEEN 1 AND 100),
    is_milestone_locked BOOLEAN DEFAULT FALSE,
    linked_project_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horizon_slivers_user_tier ON public.macro_horizon_slivers (user_id, horizon_tier);

CREATE TABLE IF NOT EXISTS public.spatial_zoom_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    entity_id VARCHAR(64) NOT NULL,
    zoom_level INT CHECK (zoom_level BETWEEN 0 AND 3),
    spatial_coords_3d JSONB NOT NULL,
    target_fov NUMERIC(5,2) DEFAULT 45.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_id, zoom_level)
);

CREATE TABLE IF NOT EXISTS public.journey_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    title VARCHAR(140) NOT NULL,
    terrain_type public.waypoint_terrain_type NOT NULL DEFAULT 'valley_station',
    coord_x NUMERIC(10,3) NOT NULL,
    coord_y NUMERIC(10,3) NOT NULL,
    coord_z NUMERIC(10,3) NOT NULL,
    linked_horizon_sliver_id UUID REFERENCES public.macro_horizon_slivers(id) ON DELETE SET NULL,
    linked_pms_list_id UUID REFERENCES public.pms_lists(id) ON DELETE SET NULL,
    target_date TIMESTAMPTZ,
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    accent_glow_color VARCHAR(9) DEFAULT '#f59e0b',
    hud_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journey_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    from_waypoint_id UUID REFERENCES public.journey_waypoints(id) ON DELETE CASCADE NOT NULL,
    to_waypoint_id UUID REFERENCES public.journey_waypoints(id) ON DELETE CASCADE NOT NULL,
    path_curve_type VARCHAR(32) DEFAULT 'catmull_rom',
    is_active_pathway BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_waypoint_id, to_waypoint_id)
);

-- ─── Section 23: Mindset Massage ("The Commander's Counsel") ────────────────
DO $$ BEGIN
    CREATE TYPE public.mindset_session_mode AS ENUM ('recalibration', 'accountability_audit', 'panic_reset', 'pre_market_pep_talk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.mindset_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    session_mode public.mindset_session_mode NOT NULL DEFAULT 'recalibration',
    initial_user_state TEXT NOT NULL,
    diagnosed_friction_point TEXT,
    framework_applied VARCHAR(120),
    resolution_status VARCHAR(32) DEFAULT 'calibrated',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mindset_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.mindset_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mindset_sessions_user ON public.mindset_sessions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mindset_messages_session ON public.mindset_messages (session_id, created_at);

