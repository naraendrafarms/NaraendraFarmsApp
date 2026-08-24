-- Migration 905 (READ ONLY): per-date counts for 2025-11-07 to 2025-12-01.
SELECT 'range_by_date' AS chk, string_agg(t, ',' ORDER BY t) AS rows
  FROM (
    SELECT (to_char(d.record_date,'MMDD') || ':' || count(*)) AS t
      FROM public.daily_records d
     WHERE d.remarks = 'F20_IMPORT_2026-08-24'
       AND d.record_date BETWEEN '2025-11-07' AND '2025-12-01'
     GROUP BY d.record_date
  ) x;
