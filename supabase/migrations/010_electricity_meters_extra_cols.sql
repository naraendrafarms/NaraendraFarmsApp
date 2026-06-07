ALTER TABLE public.electricity_meters
  ADD COLUMN IF NOT EXISTS load_kw NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS notes   TEXT;
