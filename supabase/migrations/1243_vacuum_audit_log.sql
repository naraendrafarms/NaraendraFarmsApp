-- The first archive ran on 15/09/2026: 469,548 rows uploaded to the
-- audit-archive bucket as audit_log_upto_2026-08-16_20260915T150900Z.csv.gz,
-- 22,605,326 bytes, sha256 verified by reading the file back BEFORE a single
-- row was deleted. 115,055 rows remain, which is the last 30 days.
--
-- The table still reports 240 MB. Postgres marks deleted rows dead and reuses
-- the space for new ones rather than handing it back, so the FILE does not
-- shrink on its own. VACUUM FULL rewrites the table without the dead rows and
-- returns the space to the database - which is the whole point of the exercise,
-- since the 500 MB limit is measured on the file, not on the live rows.
--
-- It takes an ACCESS EXCLUSIVE lock, so audit_log is unreadable while it runs.
-- That is acceptable here and nowhere else: nothing the farm does day to day
-- reads this table. Entering a daily record, a sale or a salary WRITES an audit
-- row through a trigger, so those writes wait for the lock - seconds on a table
-- this size. It is deliberately NOT run against any table the farm reads.
--
-- Also adds the index the archive job actually needs. It pages on
-- (changed_at, id) ascending, and the only index was on changed_at DESC alone,
-- so every page had to sort. Next month's run pages straight down the index.
CREATE INDEX IF NOT EXISTS audit_log_changed_at_id_idx
  ON public.audit_log (changed_at, id);

VACUUM FULL public.audit_log;

VACUUM ANALYZE public.audit_log;

-- VERIFY: rows kept, space returned.
SELECT count(*)::int AS rows_remaining,
       min(changed_at)::date::text AS oldest_kept,
       max(changed_at)::date::text AS newest,
       pg_size_pretty(pg_total_relation_size('public.audit_log')) AS audit_size_now,
       pg_size_pretty(pg_database_size(current_database())) AS database_size_now
FROM public.audit_log;
