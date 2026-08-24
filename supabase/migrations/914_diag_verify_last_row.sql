-- Migration 914 (READ ONLY): direct check for the 2025-11-12 shed2 row.
SELECT 'last_row_check' AS chk, count(*)::int AS n
  FROM public.daily_records
 WHERE shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47' AND record_date = '2025-11-12'
   AND remarks = 'F20_IMPORT_2026-08-24';
