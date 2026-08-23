-- Migration 810 (READ ONLY): Flock Lifetime's feed-gram-per-bird looks wrong
-- for Flock 20 (18g actual vs 144.68g std -- an ~8x gap). Suspect cause: the
-- week-builder in FlockLifetime.tsx counts "days" in a week by incrementing
-- once per daily_records ROW, not once per distinct calendar date -- so a
-- flock recorded across several sheds a day gets "days" inflated by the shed
-- count, and feed-per-bird-per-day (feed / birds / days) comes out too low
-- by roughly that same multiple.
--
-- Check: for a sample week of Flock 20, how many daily_records ROWS exist
-- vs how many DISTINCT record_dates, and how many sheds are active.

SELECT 'f20_rows_vs_days' AS chk,
       to_char(d.record_date, 'IYYY-IW') AS iso_week,
       count(*) AS row_count,
       count(DISTINCT d.record_date) AS distinct_dates,
       count(DISTINCT d.shed_id) AS distinct_sheds,
       round(count(*)::numeric / NULLIF(count(DISTINCT d.record_date),0), 2) AS rows_per_date
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '20'
 GROUP BY to_char(d.record_date, 'IYYY-IW')
 ORDER BY iso_week
 LIMIT 15;
