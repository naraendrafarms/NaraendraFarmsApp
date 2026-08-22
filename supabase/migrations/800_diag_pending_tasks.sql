-- Migration 800 (READ ONLY): list every open development task, exactly as
-- stored, rather than recall from chat memory.

SELECT 'pending' AS chk,
       (SELECT string_agg(t, E'\n---\n' ORDER BY
             CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at)
          FROM (
            SELECT title || ' [' || COALESCE(team,'-') || '/' || priority || '] :: ' || left(description, 300) AS t
              FROM public.tasks
             WHERE task_type = 'development' AND status != 'done'
       ) x) AS open_tasks,
       (SELECT count(*) FROM public.tasks WHERE task_type = 'development' AND status != 'done') AS open_count;
