-- Migration 222: read-only. Why do feed_stock_adjustments inserts not persist?
-- Check columns, RLS, policies and grants for the authenticated role.
SELECT 'cols' AS chk,
  string_agg(column_name || ':' || is_nullable, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='feed_stock_adjustments';

SELECT 'rls' AS chk, c.relrowsecurity AS rls_on,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename='feed_stock_adjustments') AS policies,
  has_table_privilege('authenticated','public.feed_stock_adjustments','INSERT') AS ins,
  has_table_privilege('authenticated','public.feed_stock_adjustments','SELECT') AS sel
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='feed_stock_adjustments';
