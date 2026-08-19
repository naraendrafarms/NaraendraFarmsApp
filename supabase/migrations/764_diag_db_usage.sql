-- Migration 764 (READ ONLY): how much of the free plan we are actually using.
-- No change to anything — one line out, so the job log prints it.

SELECT 'usage' AS chk,
       pg_size_pretty(pg_database_size(current_database())) AS db_total,
       (SELECT string_agg(t, ' | ')
          FROM (SELECT c.relname || ' ' || pg_size_pretty(pg_total_relation_size(c.oid)) AS t,
                       pg_total_relation_size(c.oid) AS sz
                  FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relkind = 'r'
                 ORDER BY sz DESC
                 LIMIT 12) x) AS biggest_tables,
       (SELECT count(*) FROM public.audit_log) AS audit_rows,
       (SELECT count(*) FROM public.audit_log WHERE old_data IS NOT NULL OR new_data IS NOT NULL) AS audit_rows_with_values,
       (SELECT COALESCE(pg_size_pretty(SUM(pg_column_size(old_data) + pg_column_size(new_data))::bigint), '0 bytes')
          FROM public.audit_log) AS audit_value_bytes;
