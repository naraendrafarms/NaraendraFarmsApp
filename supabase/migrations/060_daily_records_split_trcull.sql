-- Split trcull_female/male into separate transfer and cull columns
ALTER TABLE public.daily_records
  ADD COLUMN IF NOT EXISTS transfer_female INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_male   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cull_female     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cull_male       INTEGER DEFAULT 0;

-- Migrate existing data: put all trcull into transfer (we can't distinguish old data)
UPDATE public.daily_records
  SET transfer_female = COALESCE(trcull_female, 0),
      transfer_male   = COALESCE(trcull_male, 0),
      cull_female     = 0,
      cull_male       = 0
  WHERE transfer_female IS NULL OR transfer_female = 0;

NOTIFY pgrst, 'reload schema';
