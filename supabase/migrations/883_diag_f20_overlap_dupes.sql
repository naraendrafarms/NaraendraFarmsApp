-- Migration 883 (READ ONLY): find every duplicate (shed_id, record_date) pair
-- within the F20_IMPORT tagged rows -- these come from the grower-label (G1-G7)
-- and laying-label (1-7) source rows mapping to the SAME real shed with
-- overlapping date ranges.
SELECT 'f20_dupe_shed_dates' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fm.name || ' sh' || s.shed_no || ' ' || d.record_date::text || ' n=' || count(*)) AS t
      FROM public.daily_records d
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
     GROUP BY s.shed_no, fm.name, d.record_date
    HAVING count(*) > 1
  ) x;
