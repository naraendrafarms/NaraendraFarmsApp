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
