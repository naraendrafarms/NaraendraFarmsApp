-- Migration 901 (READ ONLY): recount with different query text, to rule out
-- caching of identical query strings at the API layer.
SELECT 'f20_recount_v2_check' AS chk, count(d.id)::int AS total_rows
  FROM public.daily_records d WHERE d.remarks = 'F20_IMPORT_2026-08-24';
