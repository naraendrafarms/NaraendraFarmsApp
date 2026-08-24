-- Migration 828 (READ ONLY): full 27 open dev task titles, paginated to avoid
-- the run_sql.py 600-char preview truncation.
SELECT 'batch1' AS chk, string_agg(t, ' || ' ORDER BY t) AS rows FROM (
  SELECT (team || ': ' || title) AS t FROM public.tasks
   WHERE task_type='development' AND status<>'done'
   ORDER BY created_at LIMIT 9
) x;
SELECT 'batch2' AS chk, string_agg(t, ' || ' ORDER BY t) AS rows FROM (
  SELECT (team || ': ' || title) AS t FROM public.tasks
   WHERE task_type='development' AND status<>'done'
   ORDER BY created_at LIMIT 9 OFFSET 9
) x;
SELECT 'batch3' AS chk, string_agg(t, ' || ' ORDER BY t) AS rows FROM (
  SELECT (team || ': ' || title) AS t FROM public.tasks
   WHERE task_type='development' AND status<>'done'
   ORDER BY created_at LIMIT 9 OFFSET 18
) x;
