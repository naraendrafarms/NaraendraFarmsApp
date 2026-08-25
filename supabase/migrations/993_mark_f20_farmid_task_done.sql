UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: All 15 rows fixed -- farm_id set to the shed''s real farm (migration 991). Verified: post-fix SELECT for mismatched rows returns 0.'
WHERE task_type='development' AND title = 'Audit: 15 Flock 20 rows have wrong/missing farm_id';

SELECT 'task_updated' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Audit: 15 Flock 20 rows have wrong/missing farm_id' AND status='done';
