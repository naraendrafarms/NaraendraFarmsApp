-- Migration 1121: read-only. Owner reports Flock 22 moved out of
-- Kethireddypally Shed 5 on 30/06/2026. Check what the data actually says.
-- Each statement kept short: run_sql.py truncates a preview at ~600 chars.

-- 1. Shed 5 rows around the reported move-out date.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS around_30jun
FROM (
  SELECT to_char(d.record_date,'DD/MM') || ' op=' || COALESCE(d.opening_female,0)
         || ' trf=' || COALESCE(d.transfer_female,0)
         || ' mort=' || COALESCE(d.mortality_female,0)
         || ' cl=' || COALESCE(d.closing_female,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no = '5'
    AND d.record_date BETWEEN DATE '2026-06-25' AND DATE '2026-07-06'
) x;

-- 2. Anything at all after the reported move-out: how many rows, and what they hold.
SELECT count(*)::int AS rows_after_30jun,
       COALESCE(min(d.record_date)::text,'-') AS first_after,
       COALESCE(max(d.record_date)::text,'-') AS last_after,
       COALESCE(max(d.closing_female),0)::int AS max_closing_after
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no = '5'
  AND d.record_date > DATE '2026-06-30';

-- 3. On 30/06 itself, every Flock 22 shed -- did birds move anywhere?
SELECT COALESCE(string_agg(y.line, ' | ' ORDER BY y.line), 'NO F22 ROWS ON 30/06') AS all_sheds_30jun
FROM (
  SELECT s.shed_no || ': trf=' || COALESCE(d.transfer_female,0)
         || ' rcv=' || COALESCE(d.received_female,0)
         || ' cl=' || COALESCE(d.closing_female,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND d.record_date = DATE '2026-06-30'
) y;

-- 4. When did Flock 23 start in Shed 5, and with what opening?
SELECT count(*)::int AS f23_rows,
       COALESCE(min(d.record_date)::text,'-') AS f23_first,
       COALESCE(max(d.record_date)::text,'-') AS f23_last,
       COALESCE((array_agg(d.opening_female ORDER BY d.record_date))[1],0)::int AS f23_first_opening
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '23'
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally' AND s.shed_no = '5';

-- 5. Is any Flock 22 transfer recorded at all, and around that date?
SELECT count(*)::int AS f22_transfer_rows,
       COALESCE(string_agg(to_char(ft.transfer_date,'DD/MM/YY') || '=' || COALESCE(ft.female_count,0)::text, ' | '
                ORDER BY ft.transfer_date), 'NONE') AS f22_transfers
FROM public.flock_transfers ft
JOIN public.flocks f ON f.id = ft.flock_id AND f.flock_no::text = '22';
