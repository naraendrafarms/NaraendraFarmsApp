-- READ ONLY. Part B of the open development task dump (see 1364 for why it is
-- batched: run_sql.py prints only the first 5 statements, 5 rows, 600 chars).
-- Covers items 51 onwards, then three summaries for planning.

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b06
  FROM t WHERE rn BETWEEN 51 AND 60;

WITH t AS (
  SELECT priority, team, left(title, 40) AS ti,
         CASE WHEN description LIKE '%WAITING ON YOU%' THEN 'Y' ELSE '-' END AS w,
         row_number() OVER (ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                                     team, title) AS rn
    FROM public.tasks
   WHERE task_type = 'development' AND status <> 'done'
)
SELECT string_agg(upper(left(priority,1)) || '|' || left(team,4) || '|' || w || '|' || ti, ' ~ ' ORDER BY rn) AS b07
  FROM t WHERE rn BETWEEN 61 AND 70;

-- How the work splits between what I can build now and what needs your data.
SELECT 'open=' || COUNT(*)
    || ' waitingOnYou=' || COUNT(*) FILTER (WHERE description LIKE '%WAITING ON YOU%')
    || ' mine=' || COUNT(*) FILTER (WHERE description NOT LIKE '%WAITING ON YOU%')
    AS split
  FROM public.tasks WHERE task_type='development' AND status <> 'done';

-- Where the work sits, so the plan can be grouped by area rather than at random.
SELECT string_agg(team || '=' || n, ' ~ ' ORDER BY n DESC) AS by_team
  FROM ( SELECT COALESCE(team,'(none)') AS team, COUNT(*) AS n
           FROM public.tasks WHERE task_type='development' AND status <> 'done'
          GROUP BY 1 ) x;

-- Done so far, for context on how much has already shipped.
SELECT 'done=' || COUNT(*) AS completed
  FROM public.tasks WHERE task_type='development' AND status = 'done';
