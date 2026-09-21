-- The egg stock block shipped after all. I had recorded it as blocked on
-- wastage not being per grade; the app had already settled that - Egg Stock
-- deducts HE wastage from Grade A - so there was no blocker and the task
-- should not sit open claiming otherwise. Backed up before the update.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1303 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Daily Summary: hatching egg stock grade-wise, flock-wise still to add';

UPDATE public.tasks
SET status = 'done', completed_at = NOW()
WHERE task_type = 'development'
  AND title = 'Daily Summary: hatching egg stock grade-wise, flock-wise still to add'
  AND status <> 'done';

SELECT (SELECT count(*)::int FROM public.tasks_backup_1303) AS rows_backed_up,
       count(*) FILTER (WHERE status = 'done')::int  AS now_done,
       count(*) FILTER (WHERE status <> 'done')::int AS still_open
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Daily Summary: hatching egg stock grade-wise, flock-wise still to add';
