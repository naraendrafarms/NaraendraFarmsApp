-- Migration 365: Employee Advances never posted to Cash Book / Bank Ledger at
-- all — the table had no payment_mode, bank_account_id, or link columns.
-- Add them so giving a cash/bank advance to an employee actually shows up
-- in Cash Book (category='advance') or Bank Ledger, same pattern used
-- everywhere else (delete-then-reinsert on edit, via the link column).

ALTER TABLE public.employee_advances
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cash_book_id UUID REFERENCES public.cash_book(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_txn_id UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='employee_advances'
  AND column_name IN ('payment_mode','bank_account_id','cash_book_id','bank_txn_id')
ORDER BY column_name;
