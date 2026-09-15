-- Shipped 15/09/2026, so it is ticked off in the same session, as the rule says.
-- 469,548 rows went to audit-archive as
-- audit_log_upto_2026-08-16_20260915T150900Z.csv.gz, 22,605,326 bytes, sha256
-- verified by reading the file back BEFORE anything was deleted. 115,055 rows
-- remain. The database went from 291 MB to 147 MB of the 500 MB limit, and
-- audit_log from 240 MB to 96 MB. Monthly from here, on the 1st.
UPDATE public.tasks
   SET status = 'done', completed_at = now(), updated_at = now(),
       description = description || ' '
    || '=== DONE 15/09/2026. 469,548 rows archived to '
    || 'audit-archive/audit_log_upto_2026-08-16_20260915T150900Z.csv.gz, 22,605,326 bytes gzipped, '
    || 'sha256 verified by reading the file back before a single row was deleted. 115,055 rows remain '
    || '(17/08 onwards), so Undo still works for the last 30 days. DATABASE 291 MB -> 147 MB, '
    || 'audit_log 240 MB -> 96 MB, free-tier use 58 percent -> 29 percent. The whole run took 2 '
    || 'minutes 25 seconds. A (changed_at, id) index was added so future runs page down the index '
    || 'rather than sorting. Runs automatically on the 1st of each month; only this first run was '
    || 'large, a month is about 30,000 rows. NO FARM DATA WAS TOUCHED at any point.'
 WHERE task_type = 'development'
   AND title = 'Audit log is 240 MB of the 291 MB database - 82 percent';

SELECT title, status, priority FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Audit log is 240 MB%';

SELECT count(*)::int AS open_development_tasks
FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
