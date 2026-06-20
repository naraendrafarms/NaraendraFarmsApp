-- Migration 086: Fix daily_records unique constraint to include shed_id.
-- F-22 (and any multi-shed flock) needs one row per (flock, date, shed),
-- not per (flock, date, farm). The old constraint blocked a second shed row
-- on the same date with a duplicate-key error.

ALTER TABLE public.daily_records
  DROP CONSTRAINT IF EXISTS daily_records_flock_id_record_date_farm_id_key;

-- When no shed is used: one row per (flock, date, farm)
CREATE UNIQUE INDEX IF NOT EXISTS daily_records_unique_no_shed
  ON public.daily_records (flock_id, record_date, farm_id)
  WHERE shed_id IS NULL;

-- When shed is used: one row per (flock, date, farm, shed)
CREATE UNIQUE INDEX IF NOT EXISTS daily_records_unique_with_shed
  ON public.daily_records (flock_id, record_date, farm_id, shed_id)
  WHERE shed_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
