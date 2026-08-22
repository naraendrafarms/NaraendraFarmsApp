-- Migration 803 (READ ONLY): 26 open development tasks total, only the first
-- 10 seen so far (802 covered rows 1-10). Rest here, 8 per statement so all
-- fit within the runner's 5-statement print cap.

SELECT title, team, priority, left(COALESCE(description,''), 180) AS description
  FROM public.tasks
 WHERE task_type = 'development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 10 LIMIT 8;

SELECT title, team, priority, left(COALESCE(description,''), 180) AS description
  FROM public.tasks
 WHERE task_type = 'development' AND status != 'done'
 ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at
 OFFSET 18 LIMIT 8;
