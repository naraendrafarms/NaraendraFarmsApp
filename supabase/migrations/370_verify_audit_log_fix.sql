-- Migration 370: retry verification of 369's fix (369's own verify statements
-- hit a transient "OOM" error from the query-runner's cache layer, not a SQL
-- error — the policy DDL itself succeeded). Re-testing the actual trigger fire.

UPDATE public.vhl_daily_entry
SET remarks = remarks
WHERE id = (SELECT id FROM public.vhl_daily_entry ORDER BY created_at DESC LIMIT 1);

SELECT table_name, action, changed_at, summary
FROM audit_log
WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 3;
