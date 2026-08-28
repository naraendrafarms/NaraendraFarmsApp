-- Migration 1109: read-only. Migration 1108's task-list preview was truncated by
-- the runner before it reached the row that was updated, so confirm that one row
-- directly.

SELECT status AS f20_transfers_task_status
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Flock 20: record the 9 missing shed transfers in flock_transfers';
