-- The cull-column task is done: both pages now count deaths AND culls, from
-- cull_female, and the stale trcull_female reads are gone.
-- This UPDATEs a live row, so the row is COPIED FIRST, in this migration,
-- before the write.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1343 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Check whether a cumulative depletion column reads 0.0% when it should not';

UPDATE public.tasks
   SET status = 'done',
       description = description
         || E'\n\n--- CLOSED 22/09/2026 ---\nThe substance of this task, the cull-column difference, is resolved and shipped. '
         || 'Flock Lifetime counted deaths only and read the stale trcull_female column; both pages now count deaths AND culls from cull_female, '
         || 'culls have a column of their own on Flock Lifetime and on the Weekly and Monthly tabs, and the stale fetch is gone from Shed Performance too. '
         || 'Measured effect on the live flocks: F-20 12.42% to 12.88%, F-22 1.38% to 2.16%. '
         || 'The 0.0% observation that opened this task came from misreading a screenshot the owner sent as a LAYOUT reference, not a fault report - there was no bug to chase there.'
 WHERE task_type = 'development'
   AND title = 'Check whether a cumulative depletion column reads 0.0% when it should not'
   AND status <> 'done';

SELECT left(title, 50) AS title, status FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Check whether a cumulative depletion column reads 0.0% when it should not';
