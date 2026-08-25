UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: Confirmed by farm owner -- L1 = BRE 1, L2 = BRE 2.'
WHERE task_type='development' AND title = 'Feed type mapping: L1-L5 to BRE 1 / BRE 2';

SELECT 'feed_mapping_task' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Feed type mapping: L1-L5 to BRE 1 / BRE 2' AND status='done';
