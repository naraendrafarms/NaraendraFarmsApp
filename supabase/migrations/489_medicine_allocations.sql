-- Medicine Allocation: tracks medicine/vaccine issued from the central
-- store to a specific flock, separate from medicine_usage (which tracks
-- what a flock actually consumed). Runs parallel to consumption tracking
-- (not a replacement) so a real received-vs-used balance can be shown
-- per flock, the same way Feed Mill's Flock Allocation splits feed
-- production across flocks.
CREATE TABLE IF NOT EXISTS public.medicine_allocations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id         UUID REFERENCES public.flocks(id) ON DELETE CASCADE,
  medicine_id      UUID REFERENCES public.medicines_master(id) ON DELETE RESTRICT,
  allocation_date  DATE NOT NULL,
  quantity         NUMERIC(10,3) NOT NULL,
  unit             TEXT,
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicine_allocations_flock ON public.medicine_allocations(flock_id);
CREATE INDEX IF NOT EXISTS idx_medicine_allocations_medicine ON public.medicine_allocations(medicine_id);

ALTER TABLE public.medicine_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.medicine_allocations FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

SELECT count(*) AS table_exists FROM information_schema.tables WHERE table_schema='public' AND table_name='medicine_allocations';
