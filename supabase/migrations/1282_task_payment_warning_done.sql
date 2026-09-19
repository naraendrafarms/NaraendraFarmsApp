-- Marks the payment-file warning task done in the session it shipped.
-- This UPDATEs an existing row, so the row is copied to a backup table
-- FIRST, in this same migration, before the write.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1282 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Payment file gives no warning when an employee has no usable account';

UPDATE public.tasks
SET status = 'done', completed_at = NOW()
WHERE task_type = 'development'
  AND title = 'Payment file gives no warning when an employee has no usable account'
  AND status <> 'done';

SELECT (SELECT count(*)::int FROM public.tasks_backup_1282) AS rows_backed_up,
       count(*) FILTER (WHERE status = 'done')::int  AS now_done,
       count(*) FILTER (WHERE status <> 'done')::int AS still_open
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Payment file gives no warning when an employee has no usable account';
