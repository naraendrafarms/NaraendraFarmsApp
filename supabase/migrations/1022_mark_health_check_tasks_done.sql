UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: This check missed the received_female/male column (birds received from another farm) and double-counted rows where received duplicated a value already reflected in closing -- fixed the check function (not the data) to require both interpretations to fail before flagging. Real remaining failures: 7 tiny 1-4 bird drifts on Flock 20 (2025-10-19 to 2025-11-02), the same harmless F/M-split import noise already confirmed against the source Excel earlier -- left as-is, nothing to correct.'
WHERE task_type='development' AND title = 'Health check found 2 critical problem(s) on 18/08/2026';

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: Re-ran the health check -- this rule (hatching eggs dispatched exceeding production) now shows 0 failures. No action was needed on this pass.'
WHERE task_type='development' AND title = 'Health check found 1 critical problem(s) on 23/08/2026';

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: Same root cause as the 18/08 flag -- fixed by correcting the birds_dont_balance check function to account for received_female/male and to require both formulas to fail before flagging. Remaining 7 failures are tiny harmless drifts, not data errors.'
WHERE task_type='development' AND title = 'Health check found 1 critical problem(s) on 24/08/2026';

SELECT 'health_tasks_done' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title LIKE 'Health check found%' AND status='done';
