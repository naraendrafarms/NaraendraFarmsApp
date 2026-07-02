-- Diagnostic only (SELECT), no data changes. Audit Log page reportedly not
-- working — check if the audit_log table has any rows at all, and which
-- tables actually have the audit trigger attached.
SELECT 'audit_log_total' AS chk, count(*) AS n, max(changed_at) AS latest FROM public.audit_log;

SELECT 'audit_log_by_table' AS chk, table_name, count(*) AS n
FROM public.audit_log GROUP BY table_name ORDER BY n DESC LIMIT 10;

SELECT 'tables_with_audit_trigger' AS chk, event_object_table
FROM information_schema.triggers
WHERE trigger_name ILIKE '%audit%' AND event_object_schema='public'
GROUP BY event_object_table ORDER BY event_object_table;
