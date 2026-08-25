SELECT tr.id, tr.transfer_date, fm.name AS to_farm, s.shed_no AS to_shed_no, tr.to_shed_id
FROM public.flock_transfers tr
JOIN public.flocks fl ON fl.id = tr.flock_id
LEFT JOIN public.sheds s ON s.id = tr.to_shed_id
LEFT JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '19' AND tr.to_shed_id IS NOT NULL
ORDER BY tr.transfer_date;
