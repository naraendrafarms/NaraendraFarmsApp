-- Migration 199: read-only. Show flock 20's stored male feed so we can see where the
-- "used quantity" comes from and whether it is wrong. No changes made.

-- A. Identify flock 20
SELECT 'A_flock' AS chk, id, flock_no, total_placed_m, total_placed_f, status
FROM public.flocks WHERE flock_no IN ('20','F20','Flock 20') OR flock_no ILIKE '%20%'
ORDER BY flock_no LIMIT 5;

-- B. daily_feed rows for flock 20 (the Feed tab source): male_kg + stored costs
SELECT 'B_daily_feed' AS chk, df.feed_date, df.feed_type,
       df.female_kg, df.male_kg, df.female_cost, df.male_cost
FROM public.daily_feed df
JOIN public.flocks f ON f.id = df.flock_id
WHERE f.flock_no ILIKE '%20%'
ORDER BY df.feed_date DESC
LIMIT 30;

-- C. Totals: how much male feed is recorded vs female
SELECT 'C_totals' AS chk,
       COUNT(*) AS rows,
       COALESCE(SUM(df.female_kg),0) AS total_female_kg,
       COALESCE(SUM(df.male_kg),0)   AS total_male_kg,
       COALESCE(SUM(df.male_cost),0) AS total_male_cost
FROM public.daily_feed df
JOIN public.flocks f ON f.id = df.flock_id
WHERE f.flock_no ILIKE '%20%';

-- D. Cross-check against daily_records (the entry table) male feed for flock 20
SELECT 'D_daily_records' AS chk,
       COUNT(*) AS rows,
       COALESCE(SUM(dr.feed_male_kg),0)   AS dr_total_male_kg,
       COALESCE(SUM(dr.feed_female_kg),0) AS dr_total_female_kg
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
WHERE f.flock_no ILIKE '%20%';
