SELECT d.id, d.record_date, d.farm_id AS row_farm_id, s.farm_id AS shed_farm_id,
  fm_row.name AS row_farm_name, fm_shed.name AS shed_farm_name, s.shed_no
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
LEFT JOIN public.sheds s ON s.id = d.shed_id
LEFT JOIN public.farms fm_row ON fm_row.id = d.farm_id
LEFT JOIN public.farms fm_shed ON fm_shed.id = s.farm_id
WHERE fl.flock_no::text = '20'
  AND s.id IS NOT NULL
  AND (d.farm_id IS DISTINCT FROM s.farm_id)
ORDER BY d.record_date;
