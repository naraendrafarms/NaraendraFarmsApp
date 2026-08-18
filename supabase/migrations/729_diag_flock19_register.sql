-- Migration 729: read-only. Flock 19 shows daily records to 03/07/2026 in All
-- Flock Data, but HE Dispatch > Daily Stock Register stops carrying egg figures
-- after 17/01/2026. The register reads daily_records with a bare select, which
-- the server caps at 1,000 rows — so find out whether row number 1,000 for this
-- flock falls on exactly that date.

SELECT 'flock19_rows' AS chk, count(*)::int AS daily_rows,
       min(record_date) AS first_date, max(record_date) AS last_date,
       count(DISTINCT record_date)::int AS distinct_days,
       count(DISTINCT shed_id)::int AS sheds
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19');

-- The date the 1,000th row lands on, in the same order the page asks for.
SELECT 'row_1000_date' AS chk, record_date
FROM (
  SELECT record_date, row_number() OVER (ORDER BY record_date, id) AS rn
  FROM public.daily_records
  WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
) x WHERE rn = 1000;

SELECT 'rows_after_cutoff' AS chk, count(*)::int AS rows_dropped,
       count(DISTINCT record_date)::int AS days_dropped
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
  AND record_date > DATE '2026-01-17';

-- Same question for the other tables the register reads, so the fix covers
-- every one of them rather than the one that happens to be biggest today.
SELECT 'other_tables' AS chk,
       (SELECT count(*)::int FROM public.he_dispatch_lines) AS dispatch_lines_all_flocks,
       (SELECT count(*)::int FROM public.egg_conversions) AS conversions_all_flocks,
       (SELECT count(*)::int FROM public.egg_opening_stock) AS opening_all_flocks,
       (SELECT count(*)::int FROM public.daily_records) AS daily_records_all_flocks;
