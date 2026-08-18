-- Migration 724: read-only. Before changing anything, measure what a
-- "transfer also moves the shed allocation" rule would touch — and what the
-- widened Bulk Daily Entry shed list will now show that it did not before.

SELECT 'transfers_overall' AS chk, count(*)::int AS transfers,
       count(*) FILTER (WHERE to_shed_id IS NOT NULL)::int AS with_destination_shed,
       count(DISTINCT flock_id)::int AS flocks
FROM public.flock_transfers;

-- Destinations that no allocation covers: these are the sheds a flock moved
-- into that no screen reading allocations can see.
SELECT 'destinations_without_allocation' AS chk,
       count(*)::int AS transfer_rows,
       count(DISTINCT (t.flock_id, t.to_shed_id))::int AS flock_shed_pairs,
       count(DISTINCT t.flock_id)::int AS flocks
FROM public.flock_transfers t
WHERE t.to_shed_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                  WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id);

-- Which flocks, and whether daily data has already been entered against that
-- destination shed (if it has, the shed was reachable some other way and the
-- figures already exist — nothing here should disturb them).
SELECT 'by_flock' AS chk, f.flock_no,
       count(DISTINCT t.to_shed_id)::int AS destination_sheds_unallocated,
       count(DISTINCT dr.id)::int AS daily_rows_already_on_those_sheds
FROM public.flock_transfers t
JOIN public.flocks f ON f.id = t.flock_id
LEFT JOIN public.daily_records dr ON dr.flock_id = t.flock_id AND dr.shed_id = t.to_shed_id
WHERE t.to_shed_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                  WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)
GROUP BY f.flock_no ORDER BY f.flock_no;

-- Flocks that have flock_sheds rows AND allocations: the Bulk list used to
-- stop at flock_sheds, and now unions the two, so these are the flocks whose
-- shed list could GAIN entries.
SELECT 'union_effect' AS chk, count(*)::int AS flocks_gaining_sheds
FROM (
  SELECT fs.flock_id
  FROM public.flock_sheds fs
  GROUP BY fs.flock_id
  HAVING EXISTS (SELECT 1 FROM public.shed_allocations a
                 WHERE a.flock_id = fs.flock_id
                   AND a.shed_id NOT IN (SELECT shed_id FROM public.flock_sheds x WHERE x.flock_id = fs.flock_id))
) z;
