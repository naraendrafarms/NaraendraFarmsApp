SELECT count(*)::int AS rows FROM public.tasks WHERE task_type='development' AND status <> 'done';
