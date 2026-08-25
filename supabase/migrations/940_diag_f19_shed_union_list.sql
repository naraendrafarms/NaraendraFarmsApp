WITH f AS (SELECT id, farm_id FROM public.flocks WHERE flock_no::text='19'),
u AS (
  SELECT shed_id FROM public.flock_sheds WHERE flock_id=(SELECT id FROM f)
  UNION
  SELECT shed_id FROM public.shed_allocations WHERE flock_id=(SELECT id FROM f)
  UNION
  SELECT to_shed_id FROM public.flock_transfers WHERE flock_id=(SELECT id FROM f) AND to_shed_id IS NOT NULL
)
SELECT 'f19_union_sheds' AS chk,
  string_agg(fm.name || ' sh' || s.shed_no ||
    CASE WHEN dr.shed_id IS NULL THEN ' [NO daily_records]' ELSE '' END, ' | ' ORDER BY fm.name, s.shed_no::int) AS rows
FROM u
JOIN public.sheds s ON s.id = u.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
LEFT JOIN LATERAL (SELECT 1 FROM public.daily_records d WHERE d.shed_id = u.shed_id AND d.flock_id=(SELECT id FROM f) LIMIT 1) dr(shed_id) ON true;
