SELECT string_agg(title || ' [' || status || ']', ' | ' ORDER BY title) AS rows
FROM public.tasks
WHERE task_type='development' AND title LIKE 'Audit:%';
