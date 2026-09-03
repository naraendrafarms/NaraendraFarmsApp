-- Migration 1163: a farm expense can record which imprest actually paid it.
--
-- Farm Expenses posts every expense to the cash book with the site on it, and
-- the balance derives the site's imprest from that. What was impossible was
-- saying that a DIFFERENT imprest paid -- Mandal or HO settling a site's bill.
-- The cost still belongs to the site; only the cash box differs. Cash Book and
-- Employee Advances already had this field; Farm Expenses did not.
--
-- Blank means the site's own cash, which is exactly what the derivation does,
-- so nothing changes for an ordinary entry.
--
-- Stored on the expense as well as written onto its cash_book row, so an edit
-- can prefill it and a report can group expenses by who paid without joining
-- through cash_book.
--
-- Nothing is backfilled: no existing expense records which imprest paid, and
-- guessing would move real balances on accounts carrying people's names.

ALTER TABLE public.farm_expenses
  ADD COLUMN IF NOT EXISTS cash_account_id UUID
  REFERENCES public.cash_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_farm_expense_cash_account
  ON public.farm_expenses(cash_account_id);

-- VERIFY 1: the column exists and nothing was backfilled.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='farm_expenses'
          AND column_name='cash_account_id') AS column_added,
       (SELECT count(*)::int FROM public.farm_expenses) AS farm_expenses,
       (SELECT count(*)::int FROM public.farm_expenses WHERE cash_account_id IS NOT NULL) AS explicitly_paid_from;

-- VERIFY 2: the rows that belong to no imprest -- the ones the owner wants to
-- allocate. Counted here so the screen showing them can be checked against a
-- known figure rather than trusted.
SELECT count(*)::int AS unassigned_rows,
       count(*) FILTER (WHERE COALESCE(e.payment_mode,'cash') = 'cash')::int AS unassigned_cash_rows,
       round(sum(COALESCE(e.amount_out,0)) FILTER (WHERE COALESCE(e.payment_mode,'cash') = 'cash'))::numeric AS unassigned_cash_paid,
       round(sum(COALESCE(e.amount_in,0)) FILTER (WHERE COALESCE(e.payment_mode,'cash') = 'cash'))::numeric AS unassigned_cash_received,
       (SELECT string_agg(DISTINCT COALESCE(f.name,'(blank)'), ', ')
        FROM public.v_imprest_entries x
        LEFT JOIN public.farms f ON f.id = x.farm_id
        WHERE x.cash_account_id IS NULL) AS unassigned_sites
FROM public.v_imprest_entries e
WHERE e.cash_account_id IS NULL;
