-- READ ONLY. Reproduce, in SQL, exactly what the HE Dispatch picker computes
-- for a dispatch dated 19/09/2026, so its figures can be checked against the
-- books rather than taken on trust from the screen.
--
-- The picker's rule: remaining on a production day = what was GRADED that day
-- (summed across sheds, since daily_records holds one row per shed per date)
-- less what previous dispatches already TOOK from that day, per grade; days
-- after the dispatch date are never offered.
SELECT 1 AS warmup;

-- Which flocks have HE dispatch history at all, and when they last went out.
SELECT f.flock_no::text AS flock,
       count(DISTINCT d.id)::int AS dispatches,
       min(d.prod_date)::text    AS earliest_prod_date,
       max(d.dispatch_date)::text AS last_dispatch,
       max(d.invoice_no)         AS last_invoice_no
FROM public.he_dispatch d
JOIN public.flocks f ON f.id = d.flock_id
GROUP BY f.flock_no ORDER BY max(d.dispatch_date) DESC NULLS LAST LIMIT 10;

-- What the picker would offer on 19/09/2026, per flock, oldest first.
WITH graded AS (
  SELECT flock_id, record_date AS prod_date,
         COALESCE(sum(he_grade_a),0)::int AS a,
         COALESCE(sum(he_grade_b),0)::int AS b,
         COALESCE(sum(he_grade_c),0)::int AS c
  FROM public.daily_records
  WHERE record_date <= DATE '2026-09-19'
  GROUP BY flock_id, record_date
), taken AS (
  SELECT flock_id, prod_date,
         COALESCE(sum(grade_a),0)::int AS a,
         COALESCE(sum(grade_b),0)::int AS b,
         COALESCE(sum(grade_c),0)::int AS c
  FROM public.he_dispatch_lines
  GROUP BY flock_id, prod_date
)
SELECT fl.flock_no::text AS flock, g.prod_date::text AS prod_date,
       GREATEST(0, g.a - COALESCE(t.a,0)) AS a_left,
       GREATEST(0, g.b - COALESCE(t.b,0)) AS b_left,
       GREATEST(0, g.c - COALESCE(t.c,0)) AS c_left,
       GREATEST(0, g.a - COALESCE(t.a,0)) + GREATEST(0, g.b - COALESCE(t.b,0))
         + GREATEST(0, g.c - COALESCE(t.c,0)) AS total_left
FROM graded g
LEFT JOIN taken t ON t.flock_id = g.flock_id AND t.prod_date = g.prod_date
JOIN public.flocks fl ON fl.id = g.flock_id
WHERE GREATEST(0, g.a - COALESCE(t.a,0)) + GREATEST(0, g.b - COALESCE(t.b,0))
        + GREATEST(0, g.c - COALESCE(t.c,0)) > 0
ORDER BY fl.flock_no, g.prod_date
LIMIT 40;

-- Any day where MORE has been dispatched than was ever graded is a real
-- problem in the books, and the picker would show it as nothing left.
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
)
SELECT count(*)::int AS days_dispatched_more_than_graded,
       COALESCE(sum((t.a - COALESCE(g.a,0)) + (t.b - COALESCE(g.b,0)) + (t.c - COALESCE(g.c,0))), 0)::int AS eggs_over
FROM taken t LEFT JOIN graded g ON g.flock_id = t.flock_id AND g.prod_date = t.prod_date
WHERE (t.a + t.b + t.c) > (COALESCE(g.a,0) + COALESCE(g.b,0) + COALESCE(g.c,0));
