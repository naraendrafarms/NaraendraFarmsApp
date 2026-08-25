SELECT 'flock_sheds' AS src, count(*) AS n
FROM public.flock_sheds fs
JOIN public.flocks fl ON fl.id = fs.flock_id
JOIN public.sheds s ON s.id = fs.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2'
UNION ALL
SELECT 'shed_allocations', count(*)
FROM public.shed_allocations sa
JOIN public.flocks fl ON fl.id = sa.flock_id
JOIN public.sheds s ON s.id = sa.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2'
UNION ALL
SELECT 'flock_transfers.to_shed_id', count(*)
FROM public.flock_transfers tr
JOIN public.flocks fl ON fl.id = tr.flock_id
JOIN public.sheds s ON s.id = tr.to_shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2'
UNION ALL
SELECT 'daily_records', count(*)
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2'
  AND d.record_date BETWEEN '2025-09-28' AND '2025-12-26';
