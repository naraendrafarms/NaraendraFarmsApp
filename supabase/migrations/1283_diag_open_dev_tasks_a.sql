-- READ ONLY. Everything still open in public.tasks as a development task.
-- Printed in slices because the job log truncates each statement's output at
-- roughly 600 characters, so one big list would be cut off and I would be
-- reporting from a half-read log again. Part A: totals and items 1-32.
-- No writes.

SELECT count(*)::int AS dev_tasks_total,
       count(*) FILTER (WHERE status = 'pending')::int      AS pending,
       count(*) FILTER (WHERE status = 'in_progress')::int  AS in_progress,
       count(*) FILTER (WHERE status = 'done')::int         AS done,
       count(*) FILTER (WHERE status = 'cancelled')::int    AS cancelled,
       count(*) FILTER (WHERE status <> 'done' AND priority = 'urgent')::int AS open_urgent,
       count(*) FILTER (WHERE status <> 'done' AND priority = 'high')::int   AS open_high
FROM public.tasks WHERE task_type = 'development';

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         priority AS p, team AS tm, left(title, 44) AS title
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, tm, title FROM t WHERE n BETWEEN 1 AND 8 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         priority AS p, team AS tm, left(title, 44) AS title
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, tm, title FROM t WHERE n BETWEEN 9 AND 16 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         priority AS p, team AS tm, left(title, 44) AS title
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, tm, title FROM t WHERE n BETWEEN 17 AND 24 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         priority AS p, team AS tm, left(title, 44) AS title
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, tm, title FROM t WHERE n BETWEEN 25 AND 32 ORDER BY n;
