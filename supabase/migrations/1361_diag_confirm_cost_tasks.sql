-- READ ONLY. Confirms the two rows 1360 was meant to insert actually landed.
--
-- WHY THIS IS NEEDED: 1360 reported Errors: 0, but its verify SELECT returned
-- 59 rows and run_sql.py prints only the first 5 in a 600-char preview. It
-- ordered by priority DESC, which puts 'high' LAST alphabetically, so the F-22
-- row could not appear in the preview at all. "Errors: 0" plus a truncated list
-- is not proof the INSERT ran - the guard is WHERE NOT EXISTS, and a guard that
-- matched something unexpected would skip the insert silently and still report
-- success.
--
-- Naming the two titles directly so the answer cannot be truncated.

SELECT 'f22Row=' || COUNT(*) AS f22_chick_cost_row
  FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'F-22 chick cost is charged%';

SELECT 'costEggRow=' || COUNT(*) AS cost_per_egg_row
  FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'Cost per Egg is only as good%';

-- Both rows with their settings, so team, priority and status are seen rather
-- than assumed.
SELECT id, left(title, 62) AS title, team, priority, status
  FROM public.tasks
 WHERE task_type = 'development'
   AND ( title LIKE 'F-22 chick cost is charged%'
      OR title LIKE 'Cost per Egg is only as good%' )
 ORDER BY id;

-- How many development tasks are open in total, by priority, so the list can be
-- read at a glance without paging through 59 rows.
SELECT 'open=' || COUNT(*)
    || ' high=' || COUNT(*) FILTER (WHERE priority = 'high')
    || ' normal=' || COUNT(*) FILTER (WHERE priority = 'normal')
    || ' low=' || COUNT(*) FILTER (WHERE priority = 'low')
    || ' other=' || COUNT(*) FILTER (WHERE priority NOT IN ('high','normal','low'))
    AS open_development_tasks
  FROM public.tasks
 WHERE task_type = 'development' AND status <> 'done';
