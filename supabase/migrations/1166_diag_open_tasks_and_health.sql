-- Migration 1166: read-only stock-take of what is still open.
--
-- Two questions from the owner:
--   (a) of the development tasks still showing "pending", which are genuinely
--       outstanding and which have already shipped in this session's work;
--   (b) what the Health Check is currently failing on.
--
-- No task is closed here. The list is printed so the owner can confirm which
-- ones to tick off; marking them done is a separate migration once they say so.
--
-- The health checks ARE re-run, because that is what the Run now button does
-- and a stale nightly result would answer (b) wrongly. That writes only to
-- health_check_results, the checks' own log -- no farm data is touched.

SELECT public.fn_run_health_checks();

-- [1] Every open development task, newest first, with enough of the text to
-- recognise it. status/priority/team included so nothing has to be guessed.
SELECT string_agg(t.txt, E'\n' ORDER BY t.ord) AS open_dev_tasks
FROM (
  SELECT row_number() OVER (ORDER BY created_at DESC) AS ord,
         '#' || row_number() OVER (ORDER BY created_at DESC) || ' ['
           || COALESCE(priority,'-') || '/' || COALESCE(team,'-') || '] '
           || title || ' :: ' || left(regexp_replace(COALESCE(description,''), '\s+', ' ', 'g'), 220) AS txt
  FROM public.tasks
  WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
) t;

-- [2] Counts, so the list length above can be trusted.
SELECT count(*) FILTER (WHERE COALESCE(status,'pending') <> 'done')::int AS open_dev,
       count(*) FILTER (WHERE status = 'done')::int AS done_dev,
       count(*)::int AS total_dev,
       (SELECT count(*)::int FROM public.tasks WHERE task_type <> 'development') AS non_dev_tasks
FROM public.tasks WHERE task_type = 'development';

-- [3] The health checks that are currently failing, from the run just made.
SELECT COALESCE(string_agg(r.txt, E'\n' ORDER BY r.sev, r.failed_count DESC), 'ALL CLEAR') AS failing_health_checks
FROM (
  SELECT CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END AS sev,
         failed_count,
         upper(severity) || ' - ' || title || ': ' || failed_count || ' rows' AS txt
  FROM public.health_check_results
  WHERE run_at = (SELECT max(run_at) FROM public.health_check_results)
    AND failed_count > 0
) r;

-- [4] The run as a whole: how many rules ran, how many passed.
SELECT (SELECT max(run_at) FROM public.health_check_results) AS run_at,
       count(*)::int AS rules_run,
       count(*) FILTER (WHERE failed_count = 0)::int AS passing,
       count(*) FILTER (WHERE failed_count > 0)::int AS failing
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results);
