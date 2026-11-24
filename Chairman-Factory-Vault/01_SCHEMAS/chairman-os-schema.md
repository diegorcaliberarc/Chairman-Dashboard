# Chairman OS / Terminus — Ground-Truth Schema Baseline (`P-13`)

> **Generated From:** Live inspection of `prisma/schema.prisma`, `supabase/migrations/*.sql`, `backend/routers/*.py`, and `app/api/**/route.ts`  
> **Isolation Contract (`P-05`):** Strict `auth.uid()` / `userId` isolation across all Personal OS tables and endpoints.  
> **Drift Rule (`P-13`):** Zero invented tables, columns, or routes. Any approved schema addition MUST be backported to this file before ticket closeout.  
> **Repo Scope Note:** No EquipSyncs tables or routes exist in this workspace; `equipsyncs-schema.md` is deferred until the EquipSyncs codebase is linked or mounted.

---

## 1. Prisma Models (`prisma/schema.prisma`, PostgreSQL)

### Enums
- `Role`: `USER`, `ADMIN`
- `EventDomain` (`@@map("event_domain")`): `engineering`, `physical_training`, `nutrition`, `family_pets`, `logistics`
- `MediaTypeEnum` (`@@map("media_type_enum")`): `image`, `video_loop`

### Tables
- **`User`**: `id` (cuid PK), `name`, `email` (unique), `emailVerified`, `image`, `role` (`Role`, default `USER`)
- **`Account`**: `id`, `userId` (FK `User`), `type`, `provider`, `providerAccountId`, `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`, `refresh_token_expires_in` (`@@unique([provider, providerAccountId])`)
- **`Session`**: `id`, `sessionToken` (unique), `userId` (FK `User`), `expires`
- **`VerificationToken`**: `identifier`, `token` (unique), `expires` (`@@unique([identifier, token])`)
- **`Scorecard`**: `id` (uuid PK), `date`, `metricName`, `value` (Float), `target` (Float), `category`, `userId` (FK `User`)
- **`Task`**: `id` (uuid PK), `title`, `pillar`, `agentId`, `category`, `status` (default `"To Do"`), `isDelegated`, `createdAt`, `priority` (default `2`), `userId` (FK `User`), `parentId` (self-FK `Task`)
- **`CircadianEvent`** (`@@map("circadian_events")`): `id` (uuid PK), `user_id` (FK `User`), `title`, `description`, `domain` (`EventDomain`), `start_time`, `end_time`, `is_recurring`, `recurrence_rule`, `media_url`, `media_type` (`MediaTypeEnum`), `media_aspect_ratio`, `accent_color`, `quadrant_slot`, `linked_task_id`, `telemetry_source`, `created_at`, `updated_at` — plus migration-added columns on `"CircadianEvent"`: `subtaskStyle`, `dailyMoneyUsed`, `anticipatedPay`, `actualPay`, `isHighlightedSpan`
- **`CircadianEventChecklist`** (`@@map("circadian_event_checklists")`): `id` (uuid PK), `event_id` (FK `CircadianEvent`), `label`, `is_completed`, `sort_order`

---

## 2. Supabase Migration Tables & Enums (`supabase/migrations/`)

### `20261112_chairman_living_os_full.sql`
- **Nutrition:** `public.nutrition_daily_logs`, `public.nutrition_meals`
- **Trading:** `public.trading_sessions`, `public.trading_trades` — Enums: `trade_direction` (`LONG`, `SHORT`), `trade_instrument` (`NQ`, `MNQ`, `ES`, `MES`)
- **Integrations:** `public.mcp_integrations`
- **Terminus / PMS (`app/pms/`):** `public.pms_lists`, `public.pms_tasks`, `public.pms_task_checklists` — Enum: `pms_status_category` (`open`, `unstarted`, `active`, `review`, `blocked`, `closed`)
- **Shared Pods & Consent:** `public.shared_pods`, `public.pod_memberships`, `public.pod_consent_grants` — Enums: `pod_type_enum` (`couple`, `family`, `business_team`), `pod_member_role` (`owner`, `partner`, `admin`, `member`, `dependent`)
- **Knowledge Vault:** `public.vault_nodes`, `public.vault_links`
- **Life Logistics & Household:** `public.life_logistics_items`, `public.household_entities`, `public.entity_telemetry_logs` — Enums: `logistics_category` (`culinary`, `household_cleaning`, `property_maintenance`, `vehicle_fleet`, `travel`, `appointment`), `entity_type_enum` (`human_adult`, `human_child`, `canine_senior`, `canine_adult`)
- **Copilot:** `public.copilot_conversations`, `public.copilot_messages`, `public.copilot_tool_executions`
- **Circadian Radar:** `public.circadian_radar_layers` — Enum: `radar_layer_type` (`energy_forecast`, `activity_density`, `posture_biometrics`, `metabolic_burn`)
- **Epistemic Planning:** `public.epistemic_planning_matrices`, `public.epistemic_matrix_items` — Enums: `epistemic_category` (`known_known`, `unknown_known`, `unknown_unknown`), `epistemic_impact` (`tactical`, `operational`, `existential`)
- **Macro Horizon & Journey:** `public.macro_horizon_pillars`, `public.macro_horizon_slivers`, `public.spatial_zoom_anchors`, `public.journey_waypoints`, `public.journey_paths` — Enums: `horizon_tier_enum` (`1_year`, `10_year`, `30_year`, `80_year`), `waypoint_terrain_type` (`summit_peak`, `valley_station`, `river_crossing`, `coastal_harbor`, `citadel`)
- **Mindset:** `public.mindset_sessions`, `public.mindset_messages` — Enum: `mindset_session_mode` (`recalibration`, `accountability_audit`, `panic_reset`, `pre_market_pep_talk`)

### `20261112_circadian_events.sql`
- Tables: `public.circadian_events`, `public.circadian_event_checklists` (RLS enabled with user-owned SELECT/MODIFY policies)

### `20261112_education_finance_habits_glass.sql`
- **Education:** `education_user_profile`, `education_class_progress`, `education_xp_ledger`
- **Calendar & Shifts:** `calendar_habits`, `calendar_habit_logs`, `calendar_highlight_spans`, `work_shift_configs`, `work_shift_logs`, `yearly_appointments`
- **Finance, Marketing, KPI & UI:** `budget_months`, `budget_entries`, `marketing_intel_items`, `kpi_scorecard_snapshots`, `user_ui_preferences`

---

## 3. FastAPI Endpoints (`backend/`)

- `GET /health` (`backend/main.py`)
- `GET /api/v1/circadian/events` (`backend/routers/circadian_router.py`)
- `POST /api/v1/circadian/events` (`backend/routers/circadian_router.py`)
- `DELETE /api/v1/circadian/events/{event_id}` (`backend/routers/circadian_router.py`)
- `GET /mcp/manifest` (`backend/routers/copilot_mcp_router.py`)
- `WS /ws/copilot/live` (`backend/routers/copilot_mcp_router.py`)
- `GET /api/v1/pods/dashboard` (`backend/routers/pods_router.py`)
- `POST /api/v1/pods/consent` (`backend/routers/pods_router.py`)

---

## 4. Next.js API Routes (`app/api/**/route.ts` — 47 Active Endpoints)

- **Auth & Core OS:** `/api/auth/[...nextauth]`, `/api/agent`, `/api/architecture/map`, `/api/artifacts`, `/api/chat`, `/api/command`, `/api/command/chat`, `/api/copilot`, `/api/integrations`, `/api/sitrep`, `/api/skills`, `/api/ui-preferences`, `/api/vault`, `/api/widgets`
- **Terminus / PMS & Roadmaps:** `/api/pms`, `/api/tasks`, `/api/roadmaps`, `/api/roadmaps/synthesize`, `/api/mission-flow`, `/api/horizon`, `/api/epistemic`, `/api/pods`
- **Calendar & Circadian:** `/api/calendar`, `/api/calendar/google-sync`, `/api/calendar-events`, `/api/calendar-events/[id]`, `/api/calendar-ops`, `/api/circadian`, `/api/circadian/radar`
- **KPIs, Finance & Marketing:** `/api/kpi-scorecard`, `/api/scorecard`, `/api/metrics`, `/api/budget`, `/api/plaid`, `/api/trading`, `/api/marketing-agent`
- **Health, Titan, Life & Education:** `/api/nutrition`, `/api/parse-food`, `/api/titan/ai-log`, `/api/titan/exercises`, `/api/titan/sessions`, `/api/titan/sets`, `/api/titan/templates`, `/api/education`, `/api/family-hub`, `/api/life-ops`, `/api/mindset`
