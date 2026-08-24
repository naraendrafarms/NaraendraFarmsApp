-- Migration 870 (READ ONLY): every (shed, date) currently tagged from migration 868,
-- so we can diff against the intended 2391 rows and find exactly what's missing.
SELECT 'f20_tagged_by_shed' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ':' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY s.shed_no, fm.name
  ) x;
