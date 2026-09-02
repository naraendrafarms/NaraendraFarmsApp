-- Migration 1118: widen shed_lines.side from A/B to A-D.
--
-- Agraharam Potlapally sheds 1 and 2 are FOUR-sided (A, B, C, D) on the owner's
-- line sheet. The original CHECK accepted only A and B, so those rows would be
-- rejected outright.
--
-- The constraint is dropped by looking it up rather than by guessing its name.
-- A DROP CONSTRAINT IF EXISTS on a wrong name succeeds silently and would leave
-- the old A/B rule in force beside the new one -- the load would then fail on
-- C and D while this migration still reported success.
--
-- Nothing else changes: shed_lines is empty, and no screen reads it yet.

DO $$
DECLARE c_name TEXT;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.shed_lines'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%side%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.shed_lines DROP CONSTRAINT %I', c_name);
  END IF;
END
$$;

ALTER TABLE public.shed_lines
  ADD CONSTRAINT shed_lines_side_check CHECK (side IN ('A','B','C','D'));

-- VERIFY: exactly one side rule, and it now lists all four.
SELECT count(*)::int AS side_constraints,
       COALESCE(string_agg(pg_get_constraintdef(oid), ' | '), 'NONE') AS side_rule
FROM pg_constraint
WHERE conrelid = 'public.shed_lines'::regclass AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%side%';
