-- Migration 827 (READ ONLY): re-check current open development tasks, compact.
SELECT 'open_dev_tasks' AS chk,
       count(*)::int AS n,
       (SELECT string_agg(t, ' || ' ORDER BY t) FROM (
          SELECT (team || ': ' || title) AS t
            FROM public.tasks
           WHERE task_type = 'development' AND status <> 'done'
           ORDER BY priority DESC, created_at
       ) x) AS rows
  FROM public.tasks
 WHERE task_type = 'development' AND status <> 'done';
