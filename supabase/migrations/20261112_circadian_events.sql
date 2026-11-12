-- 24-Hour Circadian Solar Arc Calendar & Visual Event Engine
-- Supabase PostgreSQL Migration (Zero-Trust RLS + NextAuth Compatible)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.event_domain AS ENUM ('engineering', 'physical_training', 'nutrition', 'family_pets', 'logistics');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.media_type_enum AS ENUM ('image', 'video_loop');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.circadian_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  domain public.event_domain NOT NULL DEFAULT 'engineering',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(100),

  -- Visual Media Anchor
  media_url TEXT NOT NULL,
  media_type public.media_type_enum NOT NULL DEFAULT 'image',
  media_aspect_ratio VARCHAR(10) DEFAULT '16:9',

  -- Visual Styling
  accent_color VARCHAR(9) DEFAULT '#2563eb',
  quadrant_slot INT CHECK (quadrant_slot BETWEEN 1 AND 4),

  -- Telemetry & Integration Linkages
  linked_task_id VARCHAR(64),
  telemetry_source VARCHAR(32),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_window CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_circadian_events_user_time
  ON public.circadian_events (user_id, start_time, end_time);

CREATE TABLE IF NOT EXISTS public.circadian_event_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.circadian_events(id) ON DELETE CASCADE NOT NULL,
  label VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0
);

ALTER TABLE public.circadian_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circadian_event_checklists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can only read own circadian events"
  ON public.circadian_events FOR ALL
  USING (auth.uid()::text = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only modify own event checklists"
  ON public.circadian_event_checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.circadian_events e
      WHERE e.id = circadian_event_checklists.event_id
      AND e.user_id = auth.uid()::text
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

