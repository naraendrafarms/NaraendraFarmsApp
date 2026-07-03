-- BuyerAdvancesPage posts a receipt to cash_book/bank_transactions when an
-- advance is added, but neither table had a party_advance_id link column -
-- so editing an advance (amount/date/mode) never re-synced the ledger entry,
-- and deleting an advance left its cash_book/bank_transactions row orphaned
-- (no way to find it). Add the link column both tables need.
ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS party_advance_id UUID;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS party_advance_id UUID;

CREATE INDEX IF NOT EXISTS idx_cash_book_party_advance_id
  ON public.cash_book(party_advance_id) WHERE party_advance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_party_advance_id
  ON public.bank_transactions(party_advance_id) WHERE party_advance_id IS NOT NULL;
