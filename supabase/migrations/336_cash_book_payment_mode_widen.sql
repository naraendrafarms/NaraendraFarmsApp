-- cash_book.payment_mode only allowed ('cash','upi','cheque') - every NEFT/
-- RTGS/IMPS payment was being squashed into 'cheque' by the frontend to
-- satisfy this constraint, which is misleading (a NEFT transfer is not a
-- cheque). Worse: Cash Book's own manual-entry form draws its Payment Mode
-- dropdown from config_options('payment_method'), which has included
-- neft/rtgs/imps/bank/online since migration 158 - so picking any of
-- those directly in Cash Book must have been hitting this same constraint
-- on save. Widen it to cover every value actually in use, and update the
-- frontend helpers that were squashing to 'cheque'.
DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'cash_book' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%payment_mode%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.cash_book DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.cash_book
  ADD CONSTRAINT cash_book_payment_mode_check
  CHECK (payment_mode IN ('cash','upi','cheque','neft','rtgs','imps','online','bank','bank_transfer'));

-- Diagnostic: how many past cash_book inserts from Cash Book's own manual
-- form might have failed for this reason is impossible to know (failed
-- inserts leave no row) - but confirm no existing rows use a stray value
-- outside the old allowed set (would indicate the constraint was bypassed
-- some other way, e.g. a direct DB edit).
SELECT payment_mode, COUNT(*) FROM public.cash_book GROUP BY payment_mode ORDER BY 1;
