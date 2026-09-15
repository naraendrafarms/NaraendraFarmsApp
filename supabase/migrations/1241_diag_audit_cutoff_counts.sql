-- Read-only, and deliberately cheap: two statements instead of a workflow that
-- pages through 420,000 rows, so the owner can see exactly what a 30-day
-- cutoff archives before anything is moved. Migration 1240 asked the same
-- question as its sixth statement, but run_sql.py only prints the first five.
SELECT 1 AS warmup;

SELECT count(*)::int AS total_rows,
       count(*) FILTER (WHERE changed_at <  now() - interval '30 days')::int AS would_archive,
       count(*) FILTER (WHERE changed_at >= now() - interval '30 days')::int AS would_stay,
       (now() - interval '30 days')::date::text AS cutoff_date,
       min(changed_at)::date::text AS oldest,
       max(changed_at)::date::text AS newest,
       pg_size_pretty(pg_total_relation_size('public.audit_log')) AS audit_size,
       pg_size_pretty(pg_database_size(current_database())) AS database_size
FROM public.audit_log;
