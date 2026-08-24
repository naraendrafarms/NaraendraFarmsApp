-- Migration 893 (READ ONLY): which exact dates/sheds in the 11/07-12/13 window
-- are still missing after migration 891.
SELECT 'window_counts_by_shed' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ':' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
       AND d.record_date BETWEEN '2025-11-07' AND '2025-12-13'
     GROUP BY s.shed_no, fm.name
  ) x;
