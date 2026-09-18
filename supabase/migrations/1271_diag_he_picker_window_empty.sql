-- READ ONLY. The picker shows nothing when a dispatch is started. Before
-- blaming the code, check whether there IS anything un-dispatched inside the
-- 30-day window it now defaults to (19/08/2026 to 18/09/2026).
SELECT 1 AS warmup;

WITH graded AS (
  SELECT flock_id, record_date AS prod_date,
         COALESCE(sum(he_grade_a),0)::int AS a, COALESCE(sum(he_grade_b),0)::int AS b,
         COALESCE(sum(he_grade_c),0)::int AS c
  FROM public.daily_records GROUP BY flock_id, record_date
), taken AS (
  SELECT flock_id, prod_date,
         COALESCE(sum(grade_a),0)::int AS a, COALESCE(sum(grade_b),0)::int AS b,
         COALESCE(sum(grade_c),0)::int AS c
  FROM public.he_dispatch_lines GROUP BY flock_id, prod_date
), remaining AS (
  SELECT g.flock_id, g.prod_date,
         GREATEST(0, g.a - COALESCE(t.a,0)) + GREATEST(0, g.b - COALESCE(t.b,0))
           + GREATEST(0, g.c - COALESCE(t.c,0)) AS left_total
  FROM graded g LEFT JOIN taken t ON t.flock_id = g.flock_id AND t.prod_date = g.prod_date
)
SELECT f.flock_no::text AS flock, f.status,
       count(*) FILTER (WHERE r.left_total > 0)::int AS undispatched_days_any_date,
       count(*) FILTER (WHERE r.left_total > 0
                          AND r.prod_date BETWEEN DATE '2026-08-19' AND DATE '2026-09-18')::int
         AS undispatched_days_in_30d_window,
       max(r.prod_date) FILTER (WHERE r.left_total > 0)::text AS most_recent_undispatched_day,
       COALESCE(sum(r.left_total) FILTER (WHERE r.prod_date BETWEEN DATE '2026-08-19' AND DATE '2026-09-18'),0)::int
         AS eggs_left_in_window
FROM remaining r
JOIN public.flocks f ON f.id = r.flock_id
GROUP BY f.flock_no, f.status
ORDER BY f.flock_no;

-- Is ANY graded production recorded at all in the window, dispatched or not?
SELECT count(*)::int AS graded_day_rows_in_window,
       COALESCE(sum(COALESCE(he_grade_a,0)+COALESCE(he_grade_b,0)+COALESCE(he_grade_c,0)),0)::int AS graded_eggs_in_window,
       min(record_date)::text AS first_day, max(record_date)::text AS last_day
FROM public.daily_records
WHERE record_date BETWEEN DATE '2026-08-19' AND DATE '2026-09-18';

-- When did grading last happen at all, and when was the last dispatch line?
SELECT (SELECT max(record_date)::text FROM public.daily_records
          WHERE COALESCE(he_grade_a,0)+COALESCE(he_grade_b,0)+COALESCE(he_grade_c,0) > 0) AS last_graded_day,
       (SELECT max(prod_date)::text FROM public.he_dispatch_lines) AS last_dispatched_prod_date,
       (SELECT max(dispatch_date)::text FROM public.he_dispatch)   AS last_dispatch_date;
