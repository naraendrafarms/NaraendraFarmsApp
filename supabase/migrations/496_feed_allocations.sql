-- Feed issued/received by a flock, tracked separately from consumption
-- (daily_records.feed_female_kg/feed_male_kg) so a real Received vs Used
-- balance can be shown per flock -- mirrors medicine_allocations. Today,
-- Feed Mill's Flock Allocation writes straight into Daily Records as
-- consumption with no "received but not yet used" state; this table adds
-- that missing state without changing how Flock Allocation itself works.
CREATE TABLE IF NOT EXISTS public.feed_allocations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id         UUID REFERENCES public.flocks(id) ON DELETE CASCADE,
  feed_type_id     UUID REFERENCES public.feed_types(id) ON DELETE RESTRICT,
  allocation_date  DATE NOT NULL,
  quantity_kg      NUMERIC(12,3) NOT NULL,
  rate_per_kg      NUMERIC(10,4),
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_allocations_flock ON public.feed_allocations(flock_id);
CREATE INDEX IF NOT EXISTS idx_feed_allocations_type ON public.feed_allocations(feed_type_id);

ALTER TABLE public.feed_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.feed_allocations FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

SELECT count(*) AS table_exists FROM information_schema.tables WHERE table_schema='public' AND table_name='feed_allocations';
