-- Add extra fields to hatch_batches for full hatchery tracking
ALTER TABLE public.hatch_batches
  ADD COLUMN IF NOT EXISTS setting_no   TEXT,
  ADD COLUMN IF NOT EXISTS eggs_weight  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS infertile    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS std_chicks   INTEGER;

NOTIFY pgrst, 'reload schema';
