-- The September task offers "leave them, or delete them with a backup".
-- Since 1289 there is a third and better option: FLAG them provisional, which
-- takes them out of the cost reports without deleting anything. Leaving the
-- task as it is would steer whoever reads it towards a delete that is no
-- longer necessary. Titles untouched so 1281's guard still matches.
-- UPDATEs a row, so it is copied to a backup table FIRST.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1290 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding';

UPDATE public.tasks
SET description = replace(description,
  'DECISION NEEDED: leave them to be overwritten at month end, or delete them now with a backup so the cost reports stop showing a phantom September. Nothing will be written either way until you say.',
  'GUARDED SINCE 19/09/2026 (migration 1289 and the frontend): Save & Calculate Salaries is now disabled until a month has ended - an admin can still run it after a confirmation - and anything calculated early is marked provisional and left out of Cost Analysis, the financial-year total and the salary view the P&L reads. So this cannot happen again unnoticed. DECISION STILL NEEDED ON THESE 268 ROWS, and DELETING IS NO LONGER THE ONLY WAY: (a) flag them provisional, which takes them straight out of the cost reports and deletes nothing - the safest and the recommended one; (b) leave them alone, and they are overwritten and become final when September is calculated properly at month end, but they read as cost until then; (c) delete them with a backup. Nothing will be written until you say which.')
WHERE task_type = 'development'
  AND title = 'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding';

SELECT (SELECT count(*)::int FROM public.tasks_backup_1290) AS rows_backed_up,
       count(*) FILTER (WHERE description LIKE '%DELETING IS NO LONGER THE ONLY WAY%')::int AS option_added,
       count(*) FILTER (WHERE description LIKE '%delete them now with a backup so the cost reports%')::int AS old_wording_left,
       count(*)::int AS task_found
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding';
