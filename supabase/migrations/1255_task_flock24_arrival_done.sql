-- The 14/09/2026 arrival task is finished: measured in 1254, Flock 24 now has
-- four balancing shed rows (13/09 Shed 1 1600, 14/09 Shed 1 opening 1600
-- closing 3200, 15/09 Shed 1 closing 4800, 15/09 Shed 4 3200), 8000 female
-- live on 15/09. The owner entered and corrected it on screen.
-- An untrue task list is worse than no task list, so it is ticked off here.
SELECT 1 AS warmup;

-- Backup before the UPDATE, per the no-data-loss rule - this reverses exactly.
CREATE TABLE IF NOT EXISTS public.tasks_backup_1255 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Flock 24 VHL - the 14.09.2026 arrival of 1600 female still needs entering';

UPDATE public.tasks
SET status = 'done', completed_at = NOW()
WHERE task_type = 'development'
  AND title = 'Flock 24 VHL - the 14.09.2026 arrival of 1600 female still needs entering'
  AND status <> 'done';

SELECT count(*) FILTER (WHERE status = 'done')::int    AS arrival_task_done,
       count(*) FILTER (WHERE status <> 'done')::int   AS arrival_task_still_open,
       (SELECT count(*)::int FROM public.tasks_backup_1255) AS rows_backed_up
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Flock 24 VHL - the 14.09.2026 arrival of 1600 female still needs entering';
