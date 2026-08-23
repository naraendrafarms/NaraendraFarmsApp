-- Migration 807 (READ ONLY): re-check open development tasks now, rather than
-- rely on the list read a day ago -- something may have shipped or changed.
SELECT 'pending_now' AS chk,
       (SELECT count(*) FROM public.tasks WHERE task_type='development' AND status != 'done') AS open_count;

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
 OFFSET 20 LIMIT 7;
