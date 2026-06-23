-- Migration 141: Fix daily_feed backfill — SUM across all sheds for same flock+date+type
-- daily_records can have multiple rows per flock+date (one per shed)
-- daily_feed must be ONE row per (flock_id, feed_date, feed_type) = aggregated total

-- First clear the partial data inserted by migration 140
DELETE FROM public.daily_feed;

-- Re-insert with SUM so multi-shed data is totalled correctly
INSERT INTO public.daily_feed (flock_id, feed_date, feed_type, female_kg, male_kg, female_cost, male_cost)
SELECT
  dr.flock_id::uuid,
  dr.record_date::date                                        AS feed_date,
  COALESCE(NULLIF(TRIM(dr.feed_type_f::text), ''), 'BCM')    AS feed_type,
  SUM(COALESCE(dr.feed_female_kg, 0))::numeric               AS female_kg,
  SUM(COALESCE(dr.feed_male_kg, 0))::numeric                 AS male_kg,
  0::numeric                                                  AS female_cost,
  0::numeric                                                  AS male_cost
FROM public.daily_records dr
WHERE COALESCE(dr.feed_female_kg, 0) > 0 OR COALESCE(dr.feed_male_kg, 0) > 0
GROUP BY dr.flock_id, dr.record_date, COALESCE(NULLIF(TRIM(dr.feed_type_f::text), ''), 'BCM')
ON CONFLICT (flock_id, feed_date, feed_type) DO UPDATE
  SET female_kg = EXCLUDED.female_kg,
      male_kg   = EXCLUDED.male_kg;

-- Verify
SELECT COUNT(*) AS total_rows_in_daily_feed FROM public.daily_feed;

SELECT f.flock_no, df.feed_date, df.feed_type, df.female_kg, df.male_kg
FROM public.daily_feed df
JOIN public.flocks f ON f.id = df.flock_id
ORDER BY df.feed_date DESC, f.flock_no
LIMIT 15;
