-- READ ONLY. Dumps the open development task list so a plan can be built from
-- what is actually there, not from memory.
--
-- WHY IT LOOKS LIKE THIS: run_sql.py prints only the FIRST 5 statements
-- (`if len(resp) > 0 and i < 5`), each capped at 5 rows and 600 chars of JSON.
-- A plain SELECT of 59 rows shows 5. So each statement returns ONE row holding
-- a batch of 10, aggregated, short enough to survive the 600-char cut.
--
-- Format per item:  P|team|W|title
--   P    = priority, first letter: H high, N normal, L low
--   W    = Y when the description says WAITING ON YOU (needs the owner's data
--          or decision), - when it is mine to build
-- Ordered high first, then team, so the batches read as a work queue.
-- Part A covers items 1-50; 1365 covers the rest.

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b01
  FROM t WHERE rn BETWEEN 1 AND 10;

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b02
  FROM t WHERE rn BETWEEN 11 AND 20;

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b03
  FROM t WHERE rn BETWEEN 21 AND 30;

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b04
  FROM t WHERE rn BETWEEN 31 AND 40;

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b05
  FROM t WHERE rn BETWEEN 41 AND 50;
