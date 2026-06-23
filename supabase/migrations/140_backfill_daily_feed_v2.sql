-- Migration 140: Backfill daily_feed v2 — with explicit casting and ON CONFLICT

-- First check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'daily_feed'
ORDER BY ordinal_position;

-- Check constraints on daily_feed
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.daily_feed'::regclass;

-- Now do the backfill with explicit casts and ON CONFLICT DO NOTHING
INSERT INTO public.daily_feed (flock_id, feed_date, feed_type, female_kg, male_kg, female_cost, male_cost)
SELECT
  dr.flock_id::uuid,
  dr.record_date::date,
  COALESCE(NULLIF(TRIM(dr.feed_type_f::text), ''), 'BCM'),
  COALESCE(dr.feed_female_kg, 0)::numeric,
  COALESCE(dr.feed_male_kg, 0)::numeric,
  0::numeric,
  0::numeric
FROM public.daily_records dr
WHERE COALESCE(dr.feed_female_kg, 0) > 0 OR COALESCE(dr.feed_male_kg, 0) > 0
ON CONFLICT DO NOTHING;

-- How many rows in daily_feed now?
SELECT COUNT(*) AS daily_feed_rows_after FROM public.daily_feed;

-- Sample of what got inserted
SELECT flock_id, feed_date, feed_type, female_kg, male_kg
FROM public.daily_feed
ORDER BY feed_date DESC
LIMIT 10;
