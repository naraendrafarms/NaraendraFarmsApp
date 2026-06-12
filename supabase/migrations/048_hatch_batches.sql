-- Migration 048: Hatch Batches — link HE dispatch invoices to hatchery settings
-- Replaces the standalone hatchability table workflow:
--   1. User links a dispatch invoice to a hatchery setting
--   2. After ~24 days user enters hatch report (Hitech only gives full report)
CREATE TABLE IF NOT EXISTS public.hatch_batches (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id     UUID REFERENCES public.he_dispatch(id),
  flock_id        UUID REFERENCES public.flocks(id),
  invoice_no      TEXT,
  hatchery_name   TEXT,
  setting_date    DATE,
  eggs_set        INTEGER,
  broken_transit  INTEGER DEFAULT 0,
  -- Hatch report fields (filled after hatch, Hitech provides full detail)
  fertile_eggs    INTEGER,
  hatched_chicks  INTEGER,
  culled_chicks   INTEGER DEFAULT 0,
  unhatched       INTEGER,
  blasters        INTEGER DEFAULT 0,
  rejects         INTEGER DEFAULT 0,
  chicks_sold     INTEGER,
  hatch_date      DATE,
  -- Computed % stored for quick reporting
  fertility_pct   NUMERIC(5,2),
  hatchability_pct NUMERIC(5,2),
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

NOTIFY pgrst, 'reload schema';
