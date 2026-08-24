-- Migration 840 (READ ONLY): can we recover the deleted 03/07/2026 Flock 19
-- daily_records row from the audit log? (real schema: audit_log has no
-- old_data/new_data snapshot column, just table_name/record_id/action/summary --
-- confirmed via migration 062. This checks what it actually holds.)
SELECT 'f19_0307_audit_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (a.changed_at::text || ' ' || a.action || ' ' || a.table_name
            || ' summary=' || COALESCE(a.summary,'?')
            || ' user=' || COALESCE(a.user_email,'?')) AS t
      FROM public.audit_log a
     WHERE a.table_name = 'daily_records'
       AND a.summary LIKE '%03-Jul-2026%'
     ORDER BY a.changed_at DESC
     LIMIT 10
  ) x;
