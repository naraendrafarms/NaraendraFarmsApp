-- Migration 171: Add columns to bank_transactions for statement import + reconciliation

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS statement_balance NUMERIC(16,2),
  ADD COLUMN IF NOT EXISTS match_status TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS imported BOOLEAN DEFAULT false;

-- match_status values:
--   'manual'           - entered manually by user (existing rows)
--   'waiting'          - imported from statement, not yet linked to any payment
--   'auto_matched'     - import auto-linked to a pending_payment by amount+ref match
--   'manually_matched' - user manually linked in "Waiting to Link" screen
--   'ignored'          - user marked as not relevant (salary, receipts, bank charges etc.)

-- Index for the "Waiting to Link" query
CREATE INDEX IF NOT EXISTS idx_bank_txn_waiting
  ON public.bank_transactions(match_status, txn_type, imported)
  WHERE imported = true;

SELECT 'bank_transactions extended for statement import' AS status;
