-- Migration 368: is the audit_log insert failing for ALL tables today, or just VHL?

SELECT table_name, count(*) AS rows_today
FROM audit_log
WHERE changed_at >= CURRENT_DATE
GROUP BY table_name
ORDER BY rows_today DESC;

SELECT count(*) AS total_audit_rows, max(changed_at) AS most_recent_any_table
FROM audit_log;

SELECT polname, cmd, roles::text, qual::text, with_check::text
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
WHERE c.relname = 'audit_log';

SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'audit_log';
