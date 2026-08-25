SELECT string_agg(title || ' [' || priority || '/' || team || ']', ' | ' ORDER BY
  CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, title
) AS rows
FROM (
  SELECT title, priority, team FROM public.tasks
  WHERE task_type='development' AND status <> 'done' AND priority IN ('urgent','high')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, title
  OFFSET 7
) x;
