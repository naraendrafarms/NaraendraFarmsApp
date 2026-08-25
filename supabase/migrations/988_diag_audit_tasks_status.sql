SELECT title, status, priority, team FROM public.tasks
WHERE task_type='development' AND title LIKE 'Audit:%'
ORDER BY title;
