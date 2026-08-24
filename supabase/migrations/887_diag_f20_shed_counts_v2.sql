-- Migration 887 (READ ONLY): per-shed counts after the fill attempt, to see
-- exactly which batch is still failing to insert.
SELECT 'f20_by_shed_v2' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ':' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY s.shed_no, fm.name
  ) x;
