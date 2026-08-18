-- Migration 722: read-only. Flock 23 had a shed-to-shed transfer recorded on
-- 17/08/2026, but Bulk Daily Entry shows no sheds. That screen builds its shed
-- list from flock_sheds first, then shed_allocations, then every active shed on
-- the flock's laying farm (falling back to rearing farm). Find which of those
-- three has anything for Flock 23.

SELECT 'flock' AS chk, f.id::text AS flock_id, f.flock_no, f.status,
       f.rearing_farm_id::text AS rearing_farm, f.laying_farm_id::text AS laying_farm,
       COALESCE(rf.name, '(none)') AS rearing_name, COALESCE(lf.name, '(none)') AS laying_name
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
WHERE f.flock_no::text = '23';

SELECT 'transfers' AS chk, t.transfer_date, t.female_count, t.male_count, t.is_final_transfer,
       COALESCE(fs.shed_no, '(none)') AS from_shed, COALESCE(ts.shed_no, '(none)') AS to_shed,
       COALESCE(ff.name, '(none)') AS from_farm, COALESCE(tf.name, '(none)') AS to_farm
FROM public.flock_transfers t
LEFT JOIN public.sheds fs ON fs.id = t.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = t.to_shed_id
LEFT JOIN public.farms ff ON ff.id = t.from_farm_id
LEFT JOIN public.farms tf ON tf.id = t.to_farm_id
WHERE t.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
ORDER BY t.transfer_date;

SELECT 'flock_sheds' AS chk, count(*)::int AS n,
       COALESCE(string_agg(s.shed_no, ', ' ORDER BY s.shed_no), '(none)') AS sheds
FROM public.flock_sheds x JOIN public.sheds s ON s.id = x.shed_id
WHERE x.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23');

SELECT 'shed_allocations' AS chk, count(*)::int AS n,
       COALESCE(string_agg(DISTINCT s.shed_no, ', '), '(none)') AS sheds
FROM public.shed_allocations a JOIN public.sheds s ON s.id = a.shed_id
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23');

SELECT 'sheds_on_those_farms' AS chk, fm.name AS farm, count(*)::int AS active_sheds
FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
WHERE s.is_active AND s.farm_id IN (
  SELECT rearing_farm_id FROM public.flocks WHERE flock_no::text = '23'
  UNION SELECT laying_farm_id FROM public.flocks WHERE flock_no::text = '23')
GROUP BY fm.name ORDER BY fm.name;
