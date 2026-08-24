-- Migration 903 (READ ONLY): direct check of 2025-11-07 rows under the tag.
SELECT 'check_1107' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24' AND record_date = '2025-11-07';

SELECT 'check_1108_to_1201' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24' AND record_date BETWEEN '2025-11-07' AND '2025-12-01';
