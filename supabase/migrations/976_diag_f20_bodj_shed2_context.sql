SELECT d.record_date, d.opening_female, d.opening_male, d.transfer_in_female, d.transfer_in_male,
  d.received_female, d.received_male, d.mortality_female, d.mortality_male,
  d.closing_female, d.closing_male
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND s.shed_no = '2' AND fm.name = 'Bodjanampet - 1'
  AND d.record_date BETWEEN '2025-11-10' AND '2025-11-14'
ORDER BY d.record_date;
