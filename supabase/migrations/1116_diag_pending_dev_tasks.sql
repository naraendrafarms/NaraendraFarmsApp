-- Migration 1116: read-only. The development task list as it actually stands,
-- so "what is pending?" is answered from the table and not from a transcript.

SELECT count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int    AS done,
       count(*)::int                                   AS total
FROM public.tasks WHERE task_type = 'development';

-- Pending, high priority first. Split across three statements because
-- run_sql.py truncates each preview at ~600 chars.
SELECT string_agg(title, ' | ' ORDER BY title) AS pending_high
FROM public.tasks
WHERE task_type = 'development' AND status = 'pending' AND priority = 'high';

SELECT string_agg(title, ' | ' ORDER BY title) AS pending_normal_or_low
FROM public.tasks
WHERE task_type = 'development' AND status = 'pending' AND priority <> 'high';

SELECT string_agg(title, ' | ' ORDER BY title) AS done_titles
FROM public.tasks
WHERE task_type = 'development' AND status = 'done';

-- Which team each pending item sits with.
SELECT string_agg(t || '=' || c::text, ' | ' ORDER BY t) AS pending_by_team
FROM (
  SELECT COALESCE(team,'(none)') AS t, count(*) AS c
  FROM public.tasks
  WHERE task_type = 'development' AND status = 'pending'
  GROUP BY COALESCE(team,'(none)')
) x;
