-- Migration 1108: migration 1106 recorded Flock 20's 9 missing shed transfers,
-- so the development task tracking it is done. An untrue task list is worse
-- than no list.

UPDATE public.tasks
SET status = 'done'
WHERE task_type = 'development'
  AND title = 'Flock 20: record the 9 missing shed transfers in flock_transfers'
  AND status <> 'done';

SELECT string_agg(title || ' [' || status || ']', ' | ' ORDER BY title) AS dev_tasks
FROM public.tasks
WHERE task_type = 'development';

-- Flock 22 must be untouched by 1105: it has no rows at all in that window.
SELECT count(*)::int AS f22_rows_in_sep_window
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '22')
  AND record_date BETWEEN '2025-09-24' AND '2025-09-28';
