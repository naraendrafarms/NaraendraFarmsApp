-- Add extended columns to hatchability table
ALTER TABLE public.hatchability
  ADD COLUMN IF NOT EXISTS production_date DATE,
  ADD COLUMN IF NOT EXISTS eggs_weight     NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS blasters        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unhatch         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejects         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hold_days       INTEGER GENERATED ALWAYS AS (
    CASE WHEN setting_date IS NOT NULL AND invoice_date IS NOT NULL
         THEN (setting_date - invoice_date)::integer
         ELSE NULL END
  ) STORED;

-- Index for production_date queries
CREATE INDEX IF NOT EXISTS hatchability_prod_date_idx ON public.hatchability(production_date);
CREATE INDEX IF NOT EXISTS hatchability_flock_id_idx  ON public.hatchability(flock_id);
