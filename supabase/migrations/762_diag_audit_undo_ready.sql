-- Migration 762: verify 761 — the columns, the undo function, and that new
-- changes are now recording their values.

SELECT 'ready' AS chk,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='audit_log'
          AND column_name IN ('old_data','new_data','undone_at','undone_by')) AS new_columns,
       (SELECT count(*)::int FROM pg_proc WHERE proname='fn_undo_audit') AS undo_fn,
       (SELECT count(*)::int FROM pg_proc WHERE proname='fn_prune_audit_values') AS prune_fn,
       (SELECT count(*)::int FROM public.audit_log WHERE old_data IS NOT NULL OR new_data IS NOT NULL) AS entries_with_values,
       (SELECT count(*)::int FROM public.audit_log) AS entries_total;
