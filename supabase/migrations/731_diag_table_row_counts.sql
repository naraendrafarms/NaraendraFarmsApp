-- Migration 731: read-only. Exact row counts for every table, so the hunt for
-- 1,000-row truncation is aimed at tables that can actually reach the cap
-- rather than at every query in the app. Reltuples is an estimate and would
-- mislead here, so this counts for real.

SELECT 'counts' AS chk, string_agg(t.tbl || '=' || t.n, ', ' ORDER BY t.n DESC) AS big_tables
FROM (
  SELECT c.relname AS tbl,
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT count(*) AS c FROM public.%I', c.relname), false, true, '')))[1]::text::bigint AS n
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'public' AND c.relkind = 'r'
) t
WHERE t.n >= 400;

SELECT 'near_cap' AS chk, string_agg(t.tbl || '=' || t.n, ', ' ORDER BY t.n DESC) AS over_800
FROM (
  SELECT c.relname AS tbl,
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT count(*) AS c FROM public.%I', c.relname), false, true, '')))[1]::text::bigint AS n
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'public' AND c.relkind = 'r'
) t
WHERE t.n >= 800;
