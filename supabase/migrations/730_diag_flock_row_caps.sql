-- Migration 730: read-only. Which flocks were hit by the same 1,000-row cap on
-- the Daily Stock Register, and from which date each one went blind.

SELECT 'per_flock' AS chk, f.flock_no,
       count(*)::int AS daily_rows,
       count(DISTINCT dr.shed_id)::int AS sheds,
       min(dr.record_date) AS first_date, max(dr.record_date) AS last_date,
       (count(*) > 1000) AS was_truncated
FROM public.daily_records dr JOIN public.flocks f ON f.id = dr.flock_id
GROUP BY f.flock_no ORDER BY count(*) DESC;

-- For a flock over the cap, the date its figures stopped: the 1,000th row in
-- the order the page reads them.
SELECT 'cutoff_dates' AS chk, x.flock_no, x.record_date AS blind_from
FROM (
  SELECT f.flock_no, dr.record_date,
         row_number() OVER (PARTITION BY dr.flock_id ORDER BY dr.record_date, dr.id) AS rn
  FROM public.daily_records dr JOIN public.flocks f ON f.id = dr.flock_id
) x
WHERE x.rn = 1000 ORDER BY x.flock_no;

-- With NO flock chosen the register reads every flock's rows in one request,
-- so the cap bites far earlier than it does for any single flock.
SELECT 'all_flocks_view' AS chk, count(*)::int AS total_daily_rows,
       (SELECT record_date FROM (
          SELECT record_date, row_number() OVER (ORDER BY record_date, id) AS rn
          FROM public.daily_records) y WHERE rn = 1000) AS blind_from_when_no_flock_chosen
FROM public.daily_records;
