SELECT 'f20_body_weight_rows' AS chk, count(*)::int AS n
  FROM public.flock_weekly_performance p
  JOIN public.flocks f ON f.id = p.flock_id
 WHERE f.flock_no::text = '20';
SELECT 'f20_flock_id' AS chk, id::text FROM public.flocks WHERE flock_no::text='20';
SELECT 'f20_placement' AS chk, placement_date::text FROM public.flocks WHERE flock_no::text='20';
