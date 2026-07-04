-- Migration 364: bring vhl_daily_entry to full parity with daily_records —
-- grade breakdown, wastage by type, and separate transfer/cull (previously
-- only had the combined trcull_female/male), needed for VHL Bulk (shed-wise)
-- Daily Entry to mirror the regular Bulk Daily Entry screen.
ALTER TABLE public.vhl_daily_entry
  ADD COLUMN IF NOT EXISTS he_grade_a INTEGER,
  ADD COLUMN IF NOT EXISTS he_grade_b INTEGER,
  ADD COLUMN IF NOT EXISTS he_grade_c INTEGER,
  ADD COLUMN IF NOT EXISTS wastage_he INTEGER,
  ADD COLUMN IF NOT EXISTS wastage_je INTEGER,
  ADD COLUMN IF NOT EXISTS wastage_te INTEGER,
  ADD COLUMN IF NOT EXISTS wastage_be INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_female INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_male INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cull_female INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cull_male INTEGER DEFAULT 0;

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='vhl_daily_entry'
  AND column_name IN ('he_grade_a','he_grade_b','he_grade_c','wastage_he','wastage_je','wastage_te','wastage_be','transfer_female','transfer_male','cull_female','cull_male')
ORDER BY column_name;
