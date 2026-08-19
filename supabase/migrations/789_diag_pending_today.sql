-- Migration 789 (READ ONLY): what is still open on the development list, so
-- the answer comes from the list rather than from memory of a long day.

SELECT 'pending' AS chk,
       (SELECT count(*) FROM public.tasks WHERE task_type = 'development' AND status = 'pending') AS pending_total,
       (SELECT count(*) FROM public.tasks WHERE task_type = 'development' AND status = 'done') AS done_total,
       (SELECT string_agg(t, '  ||  ' ORDER BY t) FROM (
          SELECT priority || ' - ' || title AS t
            FROM public.tasks
           WHERE task_type = 'development' AND status = 'pending'
             AND created_at >= now() - INTERVAL '2 days'
       ) x) AS raised_today,
       (SELECT string_agg(t, '  ||  ' ORDER BY t) FROM (
          SELECT title AS t
            FROM public.tasks
           WHERE task_type = 'development' AND status = 'done'
             AND created_at >= now() - INTERVAL '2 days'
       ) y) AS closed_today;
