-- Migration 802 (READ ONLY): one row per task instead of one concatenated
-- blob, so the runner's 600-char-per-row preview doesn't cut off the list.

SELECT count(*) AS open_count FROM public.tasks WHERE task_type = 'development' AND status != 'done';

SELECT title, team, priority, left(COALESCE(description,''), 200) AS description
  FROM public.tasks
 WHERE task_type = 'development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 LIMIT 5;

SELECT title, team, priority, left(COALESCE(description,''), 200) AS description
  FROM public.tasks
 WHERE task_type = 'development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 5 LIMIT 5;
