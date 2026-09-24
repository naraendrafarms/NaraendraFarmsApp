-- READ ONLY. Nothing is written, nothing is granted.
--
-- Re-runs the ONE check that failed in 1358. That run reported "Errors: 1",
-- honestly this time, because the message did not contain one of the phrases
-- run_sql.py swallows:
--   [2] ERROR: operator is not unique: "char" || unknown
--       LINE 6: SELECT c.relkind || ' ' || c.relname AS what
-- pg_class.relkind is type "char", not text, so `relkind || ' '` is ambiguous.
-- Fixed by casting it. My error, not a database problem.
--
-- 1358's other two statements DID run and are verified: 11 sequences, all with
-- USAGE and SELECT for authenticated, anon and service_role; and 0 materialised
-- views, 0 partitioned tables, 0 foreign tables - so nothing exists in public
-- outside the three relkinds 1357 granted.
--
-- This is the last unverified part of the 1357 backfill: whether anything in
-- public is still missing a grant.

SELECT 'missing=' || COUNT(*) || COALESCE(' -> ' || string_agg(x.what, ', '), ' (none)') AS missing_grants
  FROM (
    SELECT c.relkind::text || ' ' || c.relname::text AS what
      FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public'
       AND ( (c.relkind IN ('r','v','m','p') AND NOT has_table_privilege('authenticated', c.oid, 'SELECT'))
          OR (c.relkind = 'S' AND NOT has_sequence_privilege('authenticated', c.oid, 'USAGE')) )
     ORDER BY 1
  ) x;

-- Same sweep for anon, which 1357 also granted. Separate statement so one
-- failing does not hide the other.
SELECT 'anonMissing=' || COUNT(*) || COALESCE(' -> ' || string_agg(x.what, ', '), ' (none)') AS anon_missing
  FROM (
    SELECT c.relkind::text || ' ' || c.relname::text AS what
      FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public'
       AND c.relkind IN ('r','v')
       AND NOT has_table_privilege('anon', c.oid, 'SELECT')
     ORDER BY 1
  ) x;
