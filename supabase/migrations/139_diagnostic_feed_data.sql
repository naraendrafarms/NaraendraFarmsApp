-- Migration 139: Diagnostic — check feed data in daily_records and daily_feed

-- 1. How many daily_records rows have feed data?
SELECT COUNT(*) AS daily_records_with_feed
FROM public.daily_records
WHERE COALESCE(feed_female_kg, 0) > 0 OR COALESCE(feed_male_kg, 0) > 0;

-- 2. Sample of daily_records with feed (top 10)
SELECT flock_id, record_date, feed_female_kg, feed_male_kg, feed_type_f, feed_type_m
FROM public.daily_records
WHERE COALESCE(feed_female_kg, 0) > 0 OR COALESCE(feed_male_kg, 0) > 0
ORDER BY record_date DESC
LIMIT 10;

-- 3. How many rows in daily_feed?
SELECT COUNT(*) AS daily_feed_rows FROM public.daily_feed;

-- 4. Sample of daily_feed (top 10)
SELECT flock_id, feed_date, feed_type, female_kg, male_kg
FROM public.daily_feed
ORDER BY feed_date DESC
LIMIT 10;

-- 5. Flock 22 specifically — check daily_records
SELECT dr.record_date, dr.feed_female_kg, dr.feed_male_kg, dr.feed_type_f, f.flock_no
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
WHERE f.flock_no = 22
ORDER BY dr.record_date DESC
LIMIT 10;
