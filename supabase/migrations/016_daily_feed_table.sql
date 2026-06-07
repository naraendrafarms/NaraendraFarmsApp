-- Migration 016: Move daily_feed table definition from seed to migration
-- daily_feed stores per-type feed consumption (BCM, BGM, L1, L2, L3, Male, etc.)
-- with feed costs for F16, and kg-only for F19/F20

CREATE TABLE IF NOT EXISTS public.daily_feed (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id    UUID REFERENCES public.flocks(id),
  feed_date   DATE NOT NULL,
  farm_id     UUID REFERENCES public.farms(id),
  feed_type   TEXT NOT NULL,
  female_kg   NUMERIC(10,3) DEFAULT 0,
  female_cost NUMERIC(12,2) DEFAULT 0,
  male_kg     NUMERIC(10,3) DEFAULT 0,
  male_cost   NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, feed_date, feed_type)
);

ALTER TABLE public.daily_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "auth_select" ON public.daily_feed FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY IF NOT EXISTS "auth_insert" ON public.daily_feed FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY IF NOT EXISTS "auth_update" ON public.daily_feed FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY IF NOT EXISTS "auth_delete"  ON public.daily_feed FOR DELETE  USING (auth.role()='authenticated');
