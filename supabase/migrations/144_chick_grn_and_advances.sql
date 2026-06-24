-- Link GRN records to flocks (for chick purchases)
ALTER TABLE public.grn ADD COLUMN IF NOT EXISTS flock_id uuid REFERENCES public.flocks(id) ON DELETE SET NULL;

-- Hatchery advance payments (paid before chick arrival)
CREATE TABLE IF NOT EXISTS public.hatchery_advances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_date  date NOT NULL,
  flock_id      uuid REFERENCES public.flocks(id) ON DELETE SET NULL,
  party_id      uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  hatchery_name text,
  amount        numeric(12,2) NOT NULL,
  payment_mode  text DEFAULT 'Online',
  reference_no  text,
  remarks       text,
  adjusted      boolean DEFAULT false,
  adjusted_grn_id uuid REFERENCES public.grn(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

-- Allow app to read/write advances
ALTER TABLE public.hatchery_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_hatchery_advances" ON public.hatchery_advances FOR ALL USING (true) WITH CHECK (true);

-- Index for flock lookups
CREATE INDEX IF NOT EXISTS idx_grn_flock_id ON public.grn(flock_id);
CREATE INDEX IF NOT EXISTS idx_advances_flock_id ON public.hatchery_advances(flock_id);
