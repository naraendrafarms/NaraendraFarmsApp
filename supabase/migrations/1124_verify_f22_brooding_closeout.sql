-- Migration 1124: read-only verification of 1123.

-- 1. The five close-out rows, and they must all close at zero.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS closeout_rows
FROM (
  SELECT s.shed_no || ': op=' || COALESCE(d.opening_female,0)
         || '/' || COALESCE(d.opening_male,0)
         || ' trf=' || COALESCE(d.transfer_female,0) || '/' || COALESCE(d.transfer_male,0)
         || ' cl=' || COALESCE(d.closing_female,0) || '/' || COALESCE(d.closing_male,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND d.record_date = DATE '2026-06-29'
) x;

-- 2. Transferred out on 29/06 must equal 45,084, matching flock_transfers.
SELECT COALESCE(sum(d.transfer_female),0)::int AS closed_out_females,
       count(*)::int                            AS rows_written
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
  AND d.record_date = DATE '2026-06-29';

-- 3. No Flock 22 row may remain in any brooding shed after the move.
SELECT COALESCE(string_agg(s.shed_no || ' ' || d.record_date::text, ' | '), 'NONE LEFT') AS rows_after_move
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12')
  AND d.record_date > DATE '2026-06-29';

-- 4. Flock 22's live count must be unchanged at 21,745 / 5,161.
SELECT current_female, current_male
FROM public.v_flock_summary WHERE flock_no::text = '22';

-- 5. Flock 23 untouched: still in all five brooding sheds, same row count.
SELECT count(*)::int AS f23_brooding_rows,
       COALESCE(max(d.record_date)::text,'-') AS f23_last
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '23'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('5','6','10','11','12');

-- 6. Both chain triggers must be back on.
SELECT string_agg(tgname || '=' || CASE tgenabled WHEN 'O' THEN 'enabled' ELSE tgenabled::text END, ', ') AS triggers
FROM pg_trigger
WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
