SELECT s.shed_no, s.farm_id, f.name AS farm_name,
  d.record_date::text, d.opening_female, d.opening_male, d.received_female, d.received_male,
  d.closing_female, d.closing_male, d.transfer_female, d.transfer_male, d.cull_female, d.cull_male,
  d.mortality_female, d.mortality_male, d.remarks
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND s.shed_no = 2 AND f.name ILIKE '%Kethireddypally%'
  AND d.record_date BETWEEN '2026-08-18' AND '2026-08-26'
ORDER BY d.record_date;
