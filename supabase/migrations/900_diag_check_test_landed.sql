-- Migration 900 (READ ONLY): did the migration 899 single-row test actually land?
SELECT 'test_row_check' AS chk, count(*)::int AS n
  FROM public.daily_records
 WHERE shed_id = '84e234de-8212-411e-9abd-4fe5f0ef0eb7' AND record_date = '2025-12-02'
   AND remarks = 'F20_IMPORT_2026-08-24';
