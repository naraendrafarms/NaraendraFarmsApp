-- Migration 859 (READ ONLY): check what's actually in the _exp20 scratch table
-- left behind by migration 856, to diagnose why chunks 1-3 came back null.
SELECT 'exp20_count' AS chk, count(*)::int AS n FROM public._exp20;
SELECT 'exp20_sample' AS chk, string_agg(line, ' ~ ' ORDER BY rn) AS rows
  FROM (SELECT * FROM public._exp20 ORDER BY rn LIMIT 10) x;
