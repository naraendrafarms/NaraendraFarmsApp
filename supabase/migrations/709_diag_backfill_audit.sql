-- Diagnostic only: read back what 708 captured.
SELECT COALESCE(string_agg(stage || ' -> ' || note, '  ||  ' ORDER BY captured_at, stage), 'NOTHING CAPTURED') AS audit
FROM public._audit_feedmill_backfill;
