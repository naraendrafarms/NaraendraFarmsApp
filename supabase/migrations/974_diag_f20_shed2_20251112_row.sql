SELECT d.id, d.flock_id, d.shed_id, d.record_date,
  d.opening_female, d.opening_male, d.received_female, d.received_male,
  d.transfer_in_female, d.transfer_in_male, d.mortality_female, d.mortality_male,
  d.cull_female, d.cull_male, d.trcull_female, d.trcull_male,
  d.transfer_female, d.transfer_male, d.closing_female, d.closing_male, d.remarks
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '20' AND s.shed_no = '2' AND d.record_date = '2025-11-12';
