-- Migration 937 (READ ONLY): find out why Bulk Daily Entry now shows 19 sheds
-- for Flock 19. The page unions flock_sheds + shed_allocations +
-- flock_transfers.to_shed_id (+ farm fallback if that union is empty).
-- Check each source's contribution and the real union count.
DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS public._f19shedsrc';
  EXECUTE 'CREATE TABLE public._f19shedsrc (rn serial PRIMARY KEY, chunk text)';
END $$;

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

-- List the actual sheds in the union, with farm name and shed_no, so we can see
-- which ones are extra vs the 16 sheds daily_records has ever used.
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
