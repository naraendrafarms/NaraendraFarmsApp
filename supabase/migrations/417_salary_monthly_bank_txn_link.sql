-- Bulk salary payment (mark N employees Paid with one shared CMS reference)
-- was inserting one bank_transactions row PER EMPLOYEE, so a 20-employee
-- batch showed as 20 debit lines in Bank Ledger even though the real bank
-- statement shows exactly one line for the whole batch. Add a proper FK so
-- many salary_monthly rows can point at the SAME single bank_transactions
-- row, mirroring how pending_payments already links many bills to one real
-- bank transaction (via transaction_ref) instead of fabricating N bank rows.
ALTER TABLE public.salary_monthly
  ADD COLUMN IF NOT EXISTS bank_txn_id UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL;

SELECT 'sentinel' AS marker, 1 AS n;
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='salary_monthly' AND column_name='bank_txn_id';
