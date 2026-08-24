-- Migration 872 (READ ONLY): confirm pre-existing (untagged) Flock 20 rows were
-- NOT altered by the chain-cascade trigger during migration 868's partial import.
-- Check against exact figures captured earlier (migration 856/857 output):
-- sh1 Nov-2025: open=5788 close(last)=5814 | sh7 Nov-2025: open=4047 close(last)=4066
-- Kethireddypally sh2 2025-11-12 (the one pre-existing row).
SELECT 'sh1_nov_first_last' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' open_f=' || d.opening_female || ' close_f=' || d.closing_female || ' tag=' || COALESCE(d.remarks,'NULL')) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text='20' AND fm.name='Bodjanampet - 1' AND s.shed_no='1'
       AND d.record_date IN ('2025-11-09','2025-11-30')
  ) x;

SELECT 'keth_sh2_1112' AS chk,
       string_agg((d.record_date::text || ' open_f=' || d.opening_female || '/' || d.opening_male ||
                   ' close_f=' || d.closing_female || '/' || d.closing_male || ' tag=' || COALESCE(d.remarks,'NULL')), ' | ') AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
 WHERE fl.flock_no::text='20' AND fm.name='Kethireddypally' AND s.shed_no='2' AND d.record_date='2025-11-12';

SELECT 'untagged_rows_touched_recently' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text='20' AND d.remarks IS DISTINCT FROM 'F20_IMPORT_2026-08-24'
   AND d.created_at > now() - interval '1 hour';
