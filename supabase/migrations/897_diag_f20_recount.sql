-- Migration 897 (READ ONLY): fresh total count check.
SELECT 'f20_recount' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24';
