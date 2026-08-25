SELECT title, priority, status, team, description FROM public.tasks
WHERE task_type='development' AND title LIKE '%service_role%';
