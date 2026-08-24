-- Migration 869 (READ ONLY): current state after migration 868's partial failure.
-- (1) actual count of rows tagged with the import marker;
-- (2) the trigger(s) on daily_records that could cause the numeric-overflow
--     cascade seen in migration 868's error;
-- (3) whether any date gap exists in the tagged rows (i.e. batch 5's rows truly missing).
SELECT 'f20_import_count' AS chk, count(*)::int AS n, sum(total_eggs)::bigint AS eggs_sum
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24';

SELECT 'daily_records_triggers' AS chk,
       string_agg((tgname || ':' || pg_get_triggerdef(oid)), ' ~~~ ' ORDER BY tgname) AS rows
  FROM pg_trigger
 WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal;
