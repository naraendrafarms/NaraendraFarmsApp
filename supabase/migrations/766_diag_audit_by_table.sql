-- Migration 766 (READ ONLY): what is actually filling the audit log.
-- 535,000 entries in two months is far more than 20-30 people typing; this says
-- which tables and which days produced them. No change to anything.

SELECT 'by_table' AS chk,
       (SELECT string_agg(t, ' | ')
          FROM (SELECT table_name || ' ' || count(*) || ' (' ||
                       count(*) FILTER (WHERE user_email IS NULL) || ' with no user)' AS t,
                       count(*) AS n
                  FROM public.audit_log
                 GROUP BY table_name
                 ORDER BY n DESC
                 LIMIT 10) x) AS top_tables,
       (SELECT string_agg(t, ' | ')
          FROM (SELECT to_char(changed_at::date, 'DD-Mon') || ' ' || count(*) AS t,
                       changed_at::date AS d
                  FROM public.audit_log
                 GROUP BY changed_at::date
                 ORDER BY count(*) DESC
                 LIMIT 8) y) AS busiest_days,
       (SELECT count(*) FROM public.audit_log WHERE user_email IS NULL) AS no_user_rows,
       (SELECT count(*) FROM public.audit_log WHERE action = 'INSERT') AS inserts,
       (SELECT count(*) FROM public.audit_log WHERE action = 'UPDATE') AS updates,
       (SELECT count(*) FROM public.audit_log WHERE action = 'DELETE') AS deletes;
