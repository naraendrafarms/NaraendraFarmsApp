-- Migration 138: Backfill daily_feed from daily_records
-- All feed entered via Daily Entry / Bulk Daily Entry went to daily_records.feed_female_kg
-- but the Flock → Feed tab reads from daily_feed.
-- This migration copies all existing feed data across so the Feed tab shows historical data.

INSERT INTO public.daily_feed (flock_id, feed_date, feed_type, female_kg, male_kg, female_cost, male_cost)
SELECT
  dr.flock_id,
  dr.record_date                          AS feed_date,
  COALESCE(NULLIF(dr.feed_type_f, ''), 'BCM') AS feed_type,
  COALESCE(dr.feed_female_kg, 0)          AS female_kg,
  COALESCE(dr.feed_male_kg, 0)            AS male_kg,
  0                                        AS female_cost,
  0                                        AS male_cost
FROM public.daily_records dr
WHERE
  -- only rows that actually have feed data
  (COALESCE(dr.feed_female_kg, 0) > 0 OR COALESCE(dr.feed_male_kg, 0) > 0)
  -- skip if daily_feed already has a row for this flock+date+type (avoid duplicates)
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_feed df
    WHERE df.flock_id  = dr.flock_id
      AND df.feed_date = dr.record_date
      AND df.feed_type = COALESCE(NULLIF(dr.feed_type_f, ''), 'BCM')
  );

-- Verify: show count of rows inserted
SELECT COUNT(*) AS backfilled_rows FROM public.daily_feed;
