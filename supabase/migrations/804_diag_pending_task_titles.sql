-- Migration 804 (READ ONLY): titles only (short enough to survive the
-- runner's per-row preview cap), 5 statements covering all 26 open tasks.

SELECT title, priority, team FROM public.tasks WHERE task_type='development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 0 LIMIT 5;

SELECT title, priority, team FROM public.tasks WHERE task_type='development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 5 LIMIT 5;

SELECT title, priority, team FROM public.tasks WHERE task_type='development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 10 LIMIT 5;

SELECT title, priority, team FROM public.tasks WHERE task_type='development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 15 LIMIT 5;

SELECT title, priority, team FROM public.tasks WHERE task_type='development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 20 LIMIT 6;
