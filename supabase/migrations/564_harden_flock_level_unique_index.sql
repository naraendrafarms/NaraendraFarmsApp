-- Prevents the doubled-production bug repaired in 563 from recurring.
--
-- Migration 086 created:
--   daily_records_unique_no_shed (flock_id, record_date, farm_id)
--   WHERE shed_id IS NULL
-- Postgres never treats two NULLs as equal in a unique index, so a
-- flock-level row saved with farm_id NULL did NOT collide with one that had
-- farm_id set — letting the same flock/day be saved twice and doubling the
-- HE grade production shown in the Daily Stock Register.
--
-- Replacing it with an expression index that normalises NULL farm_id to a
-- fixed sentinel UUID, so "no farm" is treated as a real, comparable value
-- and a second flock-level row for the same flock/day is rejected outright.
-- (563 already removed every existing duplicate, so this can be created
-- safely; if any duplicate remained, this statement would error loudly
-- rather than silently pass.)
DROP INDEX IF EXISTS public.daily_records_unique_no_shed;

CREATE UNIQUE INDEX IF NOT EXISTS daily_records_unique_no_shed
  ON public.daily_records (
    flock_id,
    record_date,
    (COALESCE(farm_id, '00000000-0000-0000-0000-000000000000'::uuid))
  )
  WHERE shed_id IS NULL;

-- Verify the index now exists with the COALESCE expression in its definition
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'daily_records'
  AND indexname = 'daily_records_unique_no_shed';

SELECT 'sentinel' AS marker, 1 AS n;
