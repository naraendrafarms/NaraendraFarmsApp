SELECT 'f19_body_weight_rows' AS chk, count(*)::int AS n
  FROM public.flock_weekly_performance p
  JOIN public.flocks f ON f.id = p.flock_id
 WHERE f.flock_no::text = '19';
