-- Migration 907 (READ ONLY): find exactly which dates in 11/07-11/12 are still
-- short, plus overall per-shed counts to catch any other stray gaps.
SELECT 'range_recheck' AS chk, string_agg(t, ',' ORDER BY t) AS rows
  FROM (
    SELECT (to_char(d.record_date,'MMDD') || ':' || count(*)) AS t
      FROM public.daily_records d
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
       AND d.record_date BETWEEN '2025-11-07' AND '2025-11-12'
     GROUP BY d.record_date
  ) x;

SELECT 'by_shed_final' AS chk, string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ':' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY s.shed_no, fm.name
  ) x;
