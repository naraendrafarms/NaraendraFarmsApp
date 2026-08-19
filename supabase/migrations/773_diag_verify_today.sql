-- Migration 773 (READ ONLY): confirm what shipped today is really in the
-- database, rather than trusting a green workflow.

SELECT 'verify' AS chk,
       (SELECT count(*)::int FROM pg_proc WHERE proname = 'fn_usage_stats') AS usage_fn,
       (SELECT count(*)::int FROM pg_proc WHERE proname = 'fn_undo_audit') AS undo_fn,
       (SELECT CASE WHEN prosrc LIKE '%A save that altered nothing%' THEN 'yes' ELSE 'NO' END
          FROM pg_proc WHERE proname = 'fn_audit_log') AS skip_no_change,
       (SELECT count(*)::int FROM public.tasks WHERE task_type = 'development' AND status = 'pending') AS pending_dev_tasks,
       (SELECT count(*)::int FROM public.audit_log) AS audit_rows,
       (SELECT pg_size_pretty(pg_database_size(current_database()))) AS db_size;
