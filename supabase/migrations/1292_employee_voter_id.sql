-- Voter ID (EPIC number) on the employee record. Verified first in 1291 that
-- the employees table holds 37 columns and none of them is a voter id, so this
-- adds rather than duplicates.
--
-- Nullable with no default: no existing row changes, nothing is backfilled and
-- nothing is overwritten. Every one of the 268 employees simply gains a blank
-- field to fill in.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS voter_id TEXT;

SELECT
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employees'
      AND column_name='voter_id')                    AS voter_id_column_exists,
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employees') AS employee_columns_now,
  (SELECT count(*)::int FROM public.employees)       AS employees_unchanged,
  (SELECT count(*)::int FROM public.employees WHERE voter_id IS NOT NULL) AS voter_ids_filled;
