-- Same fix migration 339 applied for party_advances (buyer side) — the
-- vendor-side ledger entry needs its own link column on cash_book and
-- bank_transactions so editing/deleting a vendor advance can find and
-- re-sync/remove its ledger row instead of leaving it orphaned.
ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS vendor_advance_id UUID;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS vendor_advance_id UUID;

CREATE INDEX IF NOT EXISTS idx_cash_book_vendor_advance_id
  ON public.cash_book(vendor_advance_id) WHERE vendor_advance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_vendor_advance_id
  ON public.bank_transactions(vendor_advance_id) WHERE vendor_advance_id IS NOT NULL;

SELECT count(*) AS cols_added FROM information_schema.columns
WHERE table_schema='public' AND column_name='vendor_advance_id'
  AND table_name IN ('cash_book','bank_transactions');
