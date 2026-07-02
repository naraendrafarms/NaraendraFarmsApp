-- Per-vendor rate differential vs the weekly Association rate
-- (e.g. Hitech = Association rate - 1.5).
CREATE TABLE IF NOT EXISTS public.he_vendor_rate_diff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id),
  diff NUMERIC(8,2) NOT NULL DEFAULT 0,  -- +/- adjustment vs Association rate
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (party_id)
);
ALTER TABLE public.he_vendor_rate_diff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.he_vendor_rate_diff FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
