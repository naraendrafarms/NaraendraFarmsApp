-- Read-only. The owner is on the free tier everywhere and asks two things:
-- will going private push GitHub Actions past its free minutes, and how long
-- before Supabase's 500 MB database limit is reached given data goes in daily.
-- The storage workflow reports 291 MB total but its per-table query is broken
-- ("column tablename does not exist"), so the breakdown has never been seen.
-- Without knowing WHICH tables hold the 291 MB, any projection is a guess.
SELECT 1 AS warmup;

-- 1. The 15 biggest tables, with indexes counted separately - an index can be
--    larger than the table it serves, and is just as much of the 500 MB.
SELECT c.relname AS table_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
       pg_size_pretty(pg_relation_size(c.oid)) AS table_only,
       pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS indexes_and_toast,
       pg_total_relation_size(c.oid) AS bytes,
       c.reltuples::bigint AS approx_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 15;

-- 2. The whole database, and what share the audit log is. Every change to 30
--    tables has stored the row before AND after since 18/08/2026, so this is
--    the one that grows with ACTIVITY rather than with farm data.
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_total,
       pg_size_pretty(COALESCE(pg_total_relation_size('public.audit_log'), 0)) AS audit_log,
       ROUND(100.0 * COALESCE(pg_total_relation_size('public.audit_log'), 0)
             / NULLIF(pg_database_size(current_database()), 0), 1) AS audit_log_pct,
       (SELECT count(*) FROM public.audit_log)::bigint AS audit_rows;

-- 3. How fast the audit log is actually filling, by month
SELECT to_char(changed_at, 'YYYY-MM') AS month, count(*)::bigint AS rows
FROM public.audit_log GROUP BY 1 ORDER BY 1;

-- 4. The real farm data going in daily, so growth can be separated from noise:
--    the tables the farm types into every day, rows in the last 30 days.
SELECT 'daily_records' AS t, count(*)::bigint AS rows_last_30d FROM public.daily_records WHERE record_date >= CURRENT_DATE - 30
UNION ALL SELECT 'attendance_daily', count(*) FROM public.attendance_daily WHERE attendance_date >= CURRENT_DATE - 30
UNION ALL SELECT 'cash_book', count(*) FROM public.cash_book WHERE txn_date >= CURRENT_DATE - 30
UNION ALL SELECT 'nhe_sales', count(*) FROM public.nhe_sales WHERE sale_date >= CURRENT_DATE - 30
UNION ALL SELECT 'he_dispatch', count(*) FROM public.he_dispatch WHERE dispatch_date >= CURRENT_DATE - 30
ORDER BY 2 DESC;
