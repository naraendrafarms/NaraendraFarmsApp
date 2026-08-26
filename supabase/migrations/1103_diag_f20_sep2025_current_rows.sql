-- Current app values for the Flock 20 rows proposed for correction. Read-only.
SELECT string_agg(s.shed_no || '@' || to_char(d.record_date,'DD') || ' o' || COALESCE(d.opening_female,0)::text
       || ' t' || COALESCE(d.transfer_female,0)::text || ' m' || COALESCE(d.mortality_female,0)::text
       || ' c' || COALESCE(d.cull_female,0)::text || ' =' || COALESCE(d.closing_female,0)::text,
       ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS female_now
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND s.shed_no IN ('1','2','3','4','7','8','9')
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28';

SELECT string_agg(s.shed_no || '@' || to_char(d.record_date,'DD') || ' o' || COALESCE(d.opening_male,0)::text
       || ' t' || COALESCE(d.transfer_male,0)::text || ' m' || COALESCE(d.mortality_male,0)::text
       || ' =' || COALESCE(d.closing_male,0)::text,
       ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS male_now
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND s.shed_no IN ('1','2','3','4','7','8','9')
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND (COALESCE(d.opening_male,0) <> 0 OR COALESCE(d.closing_male,0) <> 0);

-- Bodjanampet-1 receiving side over the same window (should NOT change)
SELECT string_agg(s.shed_no || '@' || to_char(d.record_date,'DD') || ' rcv' || COALESCE(d.received_female,0)::text
       || '/' || COALESCE(d.received_male,0)::text || ' =' || COALESCE(d.closing_female,0)::text,
       ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS bpet_receiving
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Bodjanampet - 1'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND (COALESCE(d.received_female,0) <> 0 OR COALESCE(d.received_male,0) <> 0);
