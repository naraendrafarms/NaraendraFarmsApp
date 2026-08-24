-- Migration 913 (READ ONLY): check for CHECK constraints on daily_records that
-- might silently reject the one row that keeps failing (2025-11-12, shed2 --
-- source closing_female=376 doesn't match a strict opening+in-out formula).
SELECT 'check_constraints' AS chk,
       string_agg((conname || ': ' || pg_get_constraintdef(oid)), ' ~~~ ') AS rows
  FROM pg_constraint
 WHERE conrelid = 'public.daily_records'::regclass AND contype = 'c';
