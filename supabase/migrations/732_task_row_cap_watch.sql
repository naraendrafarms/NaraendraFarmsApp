-- Migration 732: log what the row-cap audit left standing, so the ones that
-- are safe only because a table is still small do not get forgotten.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Row-cap watch: queries safe today only because the table is still small',
   'OPEN: every read was audited against real row counts and the ones truncating NOW are fixed (18/08/2026). These are correct today but have no paging, so they will fail the same silent way as their tables grow — salary_monthly reads at 723 rows (Salary Register, Statutory Filing, salary abstracts, the flock salary cost), medicine_usage at 674, nhe_sales at 455, bank_transactions at 433, cash_book at 819 in Planning, and the Dashboard alert reads 3 days of daily_records which is ~90 rows now but scales with shed count. Threshold to watch: daily rows = sheds x days, so a 12-shed flock reaches 1,000 in about 83 days. Fix: page them with fetchAllPages before they cross, rather than after somebody notices a wrong figure.',
   'Housekeeping', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';
