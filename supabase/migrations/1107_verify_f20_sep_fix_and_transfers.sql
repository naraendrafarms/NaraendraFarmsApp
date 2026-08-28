-- Migration 1107: read-only verification of 1105 (Sep-2025 transfers-out) and
-- 1106 (the 9 missing flock_transfers). Writes nothing.

-- 1. The 11 corrected September rows vs the Excel closings.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS sep_rows
FROM (
  SELECT s.shed_no || '@' || to_char(d.record_date,'DD/MM') || ' trfF=' || COALESCE(d.transfer_female,0)
         || ' recF=' || COALESCE(d.received_female,0) || ' cloF=' || COALESCE(d.closing_female,0)
         || ' trfM=' || COALESCE(d.transfer_male,0) || ' cloM=' || COALESCE(d.closing_male,0) AS line
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
    AND fm.name = 'Kethireddypally'
    AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
) x;

-- 2. Both chain triggers must be back on.
SELECT string_agg(tgname || '=' || CASE tgenabled WHEN 'O' THEN 'enabled' ELSE tgenabled::text END, ', ')
       AS trigger_state
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;

-- 3. Flock 20 current birds per v_flock_summary -- must still be 31531 / 3135.
SELECT current_female, current_male
FROM public.v_flock_summary
WHERE id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0';

-- 4. Bodjanampet-1's receiving side must be untouched: 35102 F / 4127 M.
SELECT COALESCE(sum(d.received_female),0)::int AS bpet_recv_f,
       COALESCE(sum(d.received_male),0)::int   AS bpet_recv_m
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND fm.name = 'Bodjanampet - 1'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28';

-- 5. The recorded transfers.
SELECT string_agg(to_char(transfer_date,'DD/MM/YY') || ' F' || COALESCE(female_count,0)
                  || '/M' || COALESCE(male_count,0), ' | ' ORDER BY transfer_date) AS f20_transfers
FROM public.flock_transfers
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0';

-- 6. Flock 22 must be byte-identical: no rows touched in the window.
SELECT count(*)::int AS f22_rows_in_sep_window
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '22')
  AND record_date BETWEEN '2025-09-24' AND '2025-09-28';
