-- Migration 902 (READ ONLY): per-date row count for the full 11/07-12/13 window,
-- to see exactly which dates are short (each date should have 8 rows: 7
-- Bodjanampet-1 sheds + Kethireddypally shed2/Kpally-G2, except pre-11/17
-- dates which only have Kethireddypally shed2/G2, and Bodjanampet dates
-- starting a bit later).
SELECT 'window_by_date' AS chk, string_agg(t, ',' ORDER BY t) AS rows
  FROM (
    SELECT (to_char(d.record_date,'MMDD') || ':' || count(*)) AS t
      FROM public.daily_records d
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
       AND d.record_date BETWEEN '2025-11-07' AND '2025-12-13'
     GROUP BY d.record_date
     ORDER BY d.record_date
  ) x;
