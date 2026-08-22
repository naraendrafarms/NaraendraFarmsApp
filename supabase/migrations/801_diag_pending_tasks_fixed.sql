-- Migration 801 (READ ONLY): 800 silently returned nothing -- its inner
-- subquery ordered by columns (priority, created_at) it never selected,
-- which errored, and run_sql.py only prints errors that carry a "message"
-- key, so it went unreported. Fixed to carry those columns through.

SELECT 'pending' AS chk,
       (SELECT string_agg(t, E'\n---\n' ORDER BY prio_rank, created_at)
          FROM (
            SELECT title || ' [' || COALESCE(team,'-') || '/' || priority || '] :: ' || left(COALESCE(description,''), 300) AS t,
                   CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END AS prio_rank,
                   created_at
              FROM public.tasks
             WHERE task_type = 'development' AND status != 'done'
       ) x) AS open_tasks,
       (SELECT count(*) FROM public.tasks WHERE task_type = 'development' AND status != 'done') AS open_count;
