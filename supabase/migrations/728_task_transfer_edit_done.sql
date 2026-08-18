-- Migration 728: the transfer-edit fix shipped in the same session it was
-- found, so tick it off rather than leaving an untrue list.

UPDATE public.tasks
SET status = 'done', completed_at = now(),
    description = description || E'\n\nDONE 18/08/2026: an edit now takes the OLD figures back out of the source shed daily record and both sheds'' allocations, then puts the new ones in by the same path add and delete already use. Changing the date, the sheds, the farms or the counts is all covered, because the reversal reads the transfer as it stood before the save rather than assuming only the numbers changed. Ticking "Final Transfer" on an edit also sets the flock to laying now — before, the box could be ticked and nothing happened.'
WHERE task_type = 'development'
  AND title = 'Editing a transfer adjusts nothing behind it'
  AND status <> 'done';

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';
