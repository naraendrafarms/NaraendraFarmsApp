-- READ ONLY. Part B of the open development task list. 1283 asked for 8 rows
-- a statement and the job log printed only 5 of each, so 30 of the 50 open
-- items never appeared. Shorter rows this time - priority as one letter, no
-- team, title cut to 36 characters - so all 50 fit inside what the log prints.
-- No writes.

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         left(priority, 1) AS p, left(title, 36) AS t
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, t FROM t WHERE n BETWEEN 1 AND 11 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         left(priority, 1) AS p, left(title, 36) AS t
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, t FROM t WHERE n BETWEEN 12 AND 22 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         left(priority, 1) AS p, left(title, 36) AS t
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, t FROM t WHERE n BETWEEN 23 AND 33 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         left(priority, 1) AS p, left(title, 36) AS t
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, t FROM t WHERE n BETWEEN 34 AND 44 ORDER BY n;

WITH t AS (
  SELECT row_number() OVER (ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                                     WHEN 'normal' THEN 3 ELSE 4 END, title) AS n,
         left(priority, 1) AS p, left(title, 36) AS t
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done'
) SELECT p, t FROM t WHERE n BETWEEN 45 AND 55 ORDER BY n;
