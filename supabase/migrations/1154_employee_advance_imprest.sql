-- Migration 1154: an employee cash advance records which imprest paid it.
--
-- Employees -> Advances already posts a cash advance into the cash book and
-- keeps the link (cash_book_id), so that half was never broken. What it never
-- set was cash_account_id on that row, so the money left the CASH BOOK but no
-- holder's balance moved: hand an employee 5,000 out of Mandal Imprest and
-- Mandal still reads 5,000 too high, with nothing on screen to say why.
--
-- The screen now REQUIRES an imprest on a cash advance, at the owner's
-- instruction, so none can slip through untagged. This column stores it on the
-- advance as well as on the cash book row, so an edit can prefill it and a
-- report can group advances by holder without joining through cash_book.
--
-- An employee taking a salary advance is a PAYEE, not a holder: the cash leaves
-- the imprest and returns through the salary deduction. That is different from
-- Naraendra and Srinath, who hold imprest accounts of their own.
--
-- Nothing is backfilled. Existing advances do not record which tin the cash
-- came from, and guessing would move real balances on accounts with people's
-- names on them.

ALTER TABLE public.employee_advances
  ADD COLUMN IF NOT EXISTS cash_account_id UUID
  REFERENCES public.cash_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_emp_adv_cash_account
  ON public.employee_advances(cash_account_id);

-- VERIFY 1: the column and index exist, and nothing was backfilled.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='employee_advances'
          AND column_name='cash_account_id') AS column_added,
       (SELECT count(*)::int FROM pg_indexes
        WHERE schemaname='public' AND indexname='idx_emp_adv_cash_account') AS index_added,
       (SELECT count(*)::int FROM public.employee_advances) AS advance_rows,
       (SELECT count(*)::int FROM public.employee_advances WHERE cash_account_id IS NOT NULL) AS tagged_advances;

-- VERIFY 2: how many existing cash advances are untagged and therefore not
-- reflected in any holder's balance -- the size of the gap, stated rather than
-- assumed. Also how many advances never reached the cash book at all, which
-- the bulk IMPORT path does not do.
SELECT count(*) FILTER (WHERE advance_type = 'cash')::int AS cash_advances,
       count(*) FILTER (WHERE advance_type = 'cash'
                          AND COALESCE(payment_mode,'Cash') = 'Cash')::int AS paid_in_cash,
       count(*) FILTER (WHERE advance_type = 'cash'
                          AND COALESCE(payment_mode,'Cash') = 'Cash'
                          AND cash_book_id IS NULL)::int AS cash_advances_never_in_cash_book,
       (SELECT count(*)::int FROM public.cash_accounts WHERE is_active) AS imprest_accounts_available
FROM public.employee_advances;
