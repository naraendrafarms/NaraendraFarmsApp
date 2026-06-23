-- Migration 143: Add typed wastage columns to daily_records
-- wastage_eggs (existing) is kept untouched — old data is safe
-- New columns allow specifying which egg type was wasted

ALTER TABLE public.daily_records
  ADD COLUMN IF NOT EXISTS wastage_he  integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wastage_je  integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wastage_te  integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wastage_be  integer DEFAULT NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'daily_records'
  AND column_name IN ('wastage_eggs','wastage_he','wastage_je','wastage_te','wastage_be')
ORDER BY column_name;
