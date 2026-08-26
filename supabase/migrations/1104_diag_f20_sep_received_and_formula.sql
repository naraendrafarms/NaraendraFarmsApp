-- Is the Sep movement sitting in received_female on the Kethireddypally side?
-- And what formula does the live BEFORE trigger use? Read-only.
SELECT string_agg(s.shed_no || '@' || to_char(d.record_date,'DD')
       || ' rcv' || COALESCE(d.received_female,0)::text || '/' || COALESCE(d.received_male,0)::text
       || ' trf' || COALESCE(d.transfer_female,0)::text
       || ' o' || COALESCE(d.opening_female,0)::text || ' =' || COALESCE(d.closing_female,0)::text,
       ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS kpally_received
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND (COALESCE(d.received_female,0) <> 0 OR COALESCE(d.received_male,0) <> 0);

-- Count of those rows carrying a non-zero receipt
SELECT count(*)::int AS kpally_rows_with_receipt
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND (COALESCE(d.received_female,0) <> 0 OR COALESCE(d.received_male,0) <> 0);

-- Live BEFORE-trigger formula: does it include received_female?
SELECT p.proname,
       (pg_get_functiondef(p.oid) LIKE '%received_female%') AS uses_received,
       (pg_get_functiondef(p.oid) LIKE '%transfer_female%') AS uses_transfer
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('fn_chain_daily_opening','fn_chain_cascade');
