-- Migration 765 (READ ONLY): how fast the audit log is growing, and how much of
-- the 500 MB free plan it will eat. No change to anything.

SELECT 'growth' AS chk,
       (SELECT count(*) FROM public.audit_log WHERE changed_at >= now() - INTERVAL '30 days') AS rows_last_30d,
       (SELECT count(*) FROM public.audit_log WHERE changed_at >= now() - INTERVAL '7 days')  AS rows_last_7d,
       (SELECT count(*) FROM public.audit_log WHERE changed_at <  now() - INTERVAL '365 days') AS rows_over_1yr,
       (SELECT count(*) FROM public.audit_log WHERE changed_at <  now() - INTERVAL '180 days') AS rows_over_180d,
       (SELECT to_char(min(changed_at), 'DD-Mon-YYYY') FROM public.audit_log) AS oldest,
       (SELECT pg_size_pretty(pg_relation_size('public.audit_log'))) AS table_only,
       (SELECT pg_size_pretty(pg_indexes_size('public.audit_log'))) AS indexes_only,
       (SELECT COALESCE(sum(pg_total_relation_size(c.oid)), 0)::bigint FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'storage' AND c.relkind = 'r') AS storage_schema_bytes;
