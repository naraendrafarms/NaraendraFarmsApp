-- READ ONLY. The new Daily Summary egg stock block includes CLOSED flocks, on
-- my reasoning that a flock can close while eggs are still in the cold room.
-- The owner is questioning that, so measure it rather than argue: which closed
-- flocks actually carry a balance, and how big is it.
--
-- Same arithmetic the block uses, which is Egg Stock's convention:
--   A = opening A + graded A - HE wastage - dispatched A
--   B = opening B + graded B              - dispatched B
--   C = opening C + graded C              - dispatched C

WITH op AS (
  SELECT flock_id,
         SUM(COALESCE(he_grade_a,0)) a, SUM(COALESCE(he_grade_b,0)) b, SUM(COALESCE(he_grade_c,0)) c
  FROM public.egg_opening_stock GROUP BY flock_id
), gr AS (
  SELECT flock_id,
         SUM(COALESCE(he_grade_a,0) - COALESCE(wastage_he,0)) a,
         SUM(COALESCE(he_grade_b,0)) b,
         SUM(COALESCE(he_grade_c,0)) c,
         MAX(record_date) AS last_record
  FROM public.daily_records GROUP BY flock_id
), dp AS (
  SELECT l.flock_id,
         SUM(COALESCE(l.grade_a,0)) a, SUM(COALESCE(l.grade_b,0)) b, SUM(COALESCE(l.grade_c,0)) c,
         MAX(d.dispatch_date) AS last_dispatch
  FROM public.he_dispatch_lines l
  JOIN public.he_dispatch d ON d.id = l.dispatch_id
  GROUP BY l.flock_id
), bal AS (
  SELECT f.id, f.flock_no, f.status,
         COALESCE(op.a,0)+COALESCE(gr.a,0)-COALESCE(dp.a,0) AS a,
         COALESCE(op.b,0)+COALESCE(gr.b,0)-COALESCE(dp.b,0) AS b,
         COALESCE(op.c,0)+COALESCE(gr.c,0)-COALESCE(dp.c,0) AS c,
         gr.last_record, dp.last_dispatch
  FROM public.flocks f
  LEFT JOIN op ON op.flock_id = f.id
  LEFT JOIN gr ON gr.flock_id = f.id
  LEFT JOIN dp ON dp.flock_id = f.id
)
SELECT status,
       count(*)::int AS flocks,
       count(*) FILTER (WHERE a+b+c <> 0)::int AS with_a_balance,
       round(SUM(a+b+c))::int AS total_eggs
FROM bal GROUP BY status ORDER BY status;

WITH op AS (
  SELECT flock_id, SUM(COALESCE(he_grade_a,0)) a, SUM(COALESCE(he_grade_b,0)) b, SUM(COALESCE(he_grade_c,0)) c
  FROM public.egg_opening_stock GROUP BY flock_id
), gr AS (
  SELECT flock_id,
         SUM(COALESCE(he_grade_a,0) - COALESCE(wastage_he,0)) a,
         SUM(COALESCE(he_grade_b,0)) b, SUM(COALESCE(he_grade_c,0)) c,
         MAX(record_date) AS last_record
  FROM public.daily_records GROUP BY flock_id
), dp AS (
  SELECT l.flock_id, SUM(COALESCE(l.grade_a,0)) a, SUM(COALESCE(l.grade_b,0)) b, SUM(COALESCE(l.grade_c,0)) c,
         MAX(d.dispatch_date) AS last_dispatch
  FROM public.he_dispatch_lines l JOIN public.he_dispatch d ON d.id = l.dispatch_id GROUP BY l.flock_id
)
SELECT f.flock_no, f.status,
       round(COALESCE(op.a,0)+COALESCE(gr.a,0)-COALESCE(dp.a,0))::int AS grade_a,
       round(COALESCE(op.b,0)+COALESCE(gr.b,0)-COALESCE(dp.b,0))::int AS grade_b,
       round(COALESCE(op.c,0)+COALESCE(gr.c,0)-COALESCE(dp.c,0))::int AS grade_c,
       gr.last_record::text AS last_daily_record,
       dp.last_dispatch::text AS last_dispatch
FROM public.flocks f
LEFT JOIN op ON op.flock_id = f.id
LEFT JOIN gr ON gr.flock_id = f.id
LEFT JOIN dp ON dp.flock_id = f.id
WHERE f.status = 'closed'
  AND (COALESCE(op.a,0)+COALESCE(gr.a,0)-COALESCE(dp.a,0)
     + COALESCE(op.b,0)+COALESCE(gr.b,0)-COALESCE(dp.b,0)
     + COALESCE(op.c,0)+COALESCE(gr.c,0)-COALESCE(dp.c,0)) <> 0
ORDER BY f.flock_no;
