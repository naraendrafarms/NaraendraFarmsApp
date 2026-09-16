-- READ ONLY. Every development task and its real status, so "have the tasks
-- been closed" is answered from the table rather than from memory.
SELECT 1 AS warmup;

SELECT count(*)::int                                        AS all_development_tasks,
       count(*) FILTER (WHERE status = 'done')::int         AS done,
       count(*) FILTER (WHERE status = 'pending')::int      AS pending,
       count(*) FILTER (WHERE status = 'in_progress')::int  AS in_progress,
       count(*) FILTER (WHERE status = 'cancelled')::int    AS cancelled
FROM public.tasks WHERE task_type = 'development';

SELECT left(title, 78) AS task, status, team, priority, created_at::date::text AS created
FROM public.tasks
WHERE task_type = 'development' AND status <> 'done'
ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         created_at DESC;

SELECT left(title, 78) AS closed_task, completed_at::date::text AS closed_on
FROM public.tasks
WHERE task_type = 'development' AND status = 'done'
ORDER BY completed_at DESC NULLS LAST
LIMIT 12;
