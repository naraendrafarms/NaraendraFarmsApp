-- Migration 1169: read-only verification of 1168. The runner prints only the
-- first few statements of a file, so 1168's own two checks never appeared in
-- the log -- "Errors: 0" alone is not proof, as the runner treats several real
-- errors as success. These are the same checks, run on their own.

SELECT (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND status='done'
          AND title IN ('Line-wise daily entry screen (parallel to Bulk Daily Entry)',
                        'Shed supervisors are not restricted to their own sheds',
                        'Shed line-wise boxes (A/B/C/D sides)',
                        'Cash imprest accounts and internal transfers')) AS four_closed,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
          AND (title LIKE 'Health check found%' OR title LIKE 'Health check:%')) AS open_health_tasks,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
          AND title = '233 old bird sales carry no shed') AS bird_sales_renamed;

SELECT count(*) FILTER (WHERE COALESCE(status,'pending') <> 'done')::int AS open_dev_now,
       count(*) FILTER (WHERE status = 'done')::int AS done_dev_now,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgname = 'trg_one_open_health_task' AND tgenabled::text = 'O') AS guard_enabled
FROM public.tasks WHERE task_type = 'development';

-- The standing task, to read back exactly what it now says.
SELECT title || ' [' || COALESCE(status,'pending') || '/' || COALESCE(priority,'-') || ']' AS standing_task
FROM public.tasks
WHERE task_type='development' AND title LIKE 'Health check%'
  AND COALESCE(status,'pending') <> 'done';
