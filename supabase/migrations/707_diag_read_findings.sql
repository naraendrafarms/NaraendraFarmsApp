-- Diagnostic only: read what 706 captured, one statement, nothing else.
SELECT COALESCE(string_agg(note, '  ||  ' ORDER BY created_at, note), 'NOTHING CAPTURED') AS findings
FROM public._diag_feedmill;
