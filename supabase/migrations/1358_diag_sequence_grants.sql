-- READ ONLY. Nothing is written, nothing is granted.
--
-- 1357 granted tables, views AND sequences, but its two verification SELECTs
-- only measured tables and views. Sequences were granted inside the DO block
-- and the RAISE NOTICE that counted them is not captured by run_sql.py, so
-- the sequence part of 1357 was applied but never actually verified. This
-- measures it rather than leaving it assumed.
--
-- Sequences matter for SAVING, not reading: a table with a serial id cannot be
-- INSERTed into without USAGE on its sequence. If these come back short, forms
-- would fail on save after 30 October on any table created from now on.

SELECT 'sequences=' || COUNT(*)
    || ' authUsage='  || COUNT(*) FILTER (WHERE has_sequence_privilege('authenticated', c.oid, 'USAGE'))
    || ' authSelect=' || COUNT(*) FILTER (WHERE has_sequence_privilege('authenticated', c.oid, 'SELECT'))
    || ' anonUsage='  || COUNT(*) FILTER (WHERE has_sequence_privilege('anon', c.oid, 'USAGE'))
    || ' svcUsage='   || COUNT(*) FILTER (WHERE has_sequence_privilege('service_role', c.oid, 'USAGE'))
    AS sequence_grants
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
 WHERE ns.nspname = 'public' AND c.relkind = 'S';

-- Name anything still missing a grant. Written as an aggregate so it ALWAYS
-- returns exactly one row: run_sql.py prints nothing for a zero-row statement,
-- which would be indistinguishable from an error it swallowed.
SELECT 'missing=' || COUNT(*) || COALESCE(' -> ' || string_agg(x.what, ', '), ' (none)') AS missing_grants
  FROM (
    SELECT c.relkind || ' ' || c.relname AS what
      FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public'
       AND ( (c.relkind IN ('r','v','m','p') AND NOT has_table_privilege('authenticated', c.oid, 'SELECT'))
          OR (c.relkind = 'S' AND NOT has_sequence_privilege('authenticated', c.oid, 'USAGE')) )
     ORDER BY 1
  ) x;

-- Materialised views and partitioned tables were not in 1357's loops at all
-- (relkind 'm' and 'p'). Count them so we know whether that omission matters.
SELECT 'matviews=' || COUNT(*) FILTER (WHERE c.relkind = 'm')
    || ' partitioned=' || COUNT(*) FILTER (WHERE c.relkind = 'p')
    || ' foreign=' || COUNT(*) FILTER (WHERE c.relkind = 'f')
    AS other_relkinds
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
 WHERE ns.nspname = 'public' AND c.relkind IN ('m','p','f');
