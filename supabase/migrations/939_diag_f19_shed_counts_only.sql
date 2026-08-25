WITH f AS (SELECT id, farm_id FROM public.flocks WHERE flock_no::text='19'),
fs AS (SELECT shed_id FROM public.flock_sheds WHERE flock_id=(SELECT id FROM f)),
sa AS (SELECT shed_id FROM public.shed_allocations WHERE flock_id=(SELECT id FROM f)),
tr AS (SELECT to_shed_id AS shed_id FROM public.flock_transfers WHERE flock_id=(SELECT id FROM f) AND to_shed_id IS NOT NULL),
dr AS (SELECT DISTINCT shed_id FROM public.daily_records WHERE flock_id=(SELECT id FROM f) AND shed_id IS NOT NULL)
SELECT 'f19_shed_source_counts' AS chk,
  concat(
    'flock_sheds=', (SELECT count(*) FROM fs),
    ' | shed_allocations=', (SELECT count(*) FROM sa),
    ' | flock_transfers.to_shed_id=', (SELECT count(*) FROM tr),
    ' | daily_records_distinct=', (SELECT count(*) FROM dr),
    ' | union(fs+sa+tr)=', (SELECT count(DISTINCT shed_id) FROM (SELECT shed_id FROM fs UNION SELECT shed_id FROM sa UNION SELECT shed_id FROM tr) u)
  ) AS rows;
