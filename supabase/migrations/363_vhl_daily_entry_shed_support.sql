-- Migration 363: add shed_id to vhl_daily_entry for VHL Bulk (shed-wise) Daily
-- Entry — same partial-unique-index pattern as daily_records (migration 086):
-- one index for flock-level rows (shed_id IS NULL), one for per-shed rows.

ALTER TABLE public.vhl_daily_entry ADD COLUMN IF NOT EXISTS shed_id UUID REFERENCES public.sheds(id);

ALTER TABLE public.vhl_daily_entry DROP CONSTRAINT IF EXISTS vhl_daily_entry_flock_id_record_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS vhl_daily_entry_unique_no_shed
  ON public.vhl_daily_entry (flock_id, record_date)
  WHERE shed_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vhl_daily_entry_unique_with_shed
  ON public.vhl_daily_entry (flock_id, record_date, shed_id)
  WHERE shed_id IS NOT NULL;

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='vhl_daily_entry' AND column_name='shed_id';
