-- Migration 082: Add source tracking columns to cash_book
-- Allows reliable delete/update of cash_book entries when the originating
-- nhe_sale or he_dispatch is deleted or edited.

ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS nhe_sale_id    UUID,
  ADD COLUMN IF NOT EXISTS he_dispatch_id UUID;

CREATE INDEX IF NOT EXISTS idx_cash_book_nhe_sale_id
  ON public.cash_book(nhe_sale_id) WHERE nhe_sale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cash_book_he_dispatch_id
  ON public.cash_book(he_dispatch_id) WHERE he_dispatch_id IS NOT NULL;

-- Backfill nhe_sale_id for entries already in cash_book (from migration 080 or earlier)
-- Match on flock_id + sale_date + amount + payment_mode + reference_no
UPDATE public.cash_book cb
SET nhe_sale_id = ns.id
FROM public.nhe_sales ns
WHERE cb.nhe_sale_id IS NULL
  AND cb.flock_id     = ns.flock_id
  AND cb.txn_date     = ns.sale_date
  AND cb.amount_in    = COALESCE(ns.payment_cash, ns.amount)
  AND cb.payment_mode = 'cash'
  AND cb.txn_type     = 'receipt'
  AND ns.payment_status = 'Received'
  AND ns.payment_mode   = 'Cash'
  AND (cb.reference_no = ns.dc_no OR (cb.reference_no IS NULL AND ns.dc_no IS NULL));

-- Backfill he_dispatch_id similarly
UPDATE public.cash_book cb
SET he_dispatch_id = hd.id
FROM public.he_dispatch hd
WHERE cb.he_dispatch_id IS NULL
  AND cb.flock_id     = hd.flock_id
  AND cb.txn_date     = hd.dispatch_date
  AND cb.amount_in    = hd.amount
  AND cb.payment_mode = 'cash'
  AND cb.txn_type     = 'receipt'
  AND hd.payment_status = 'Received'
  AND hd.payment_mode   = 'Cash'
  AND (cb.reference_no = hd.invoice_no OR (cb.reference_no IS NULL AND hd.invoice_no IS NULL));

NOTIFY pgrst, 'reload schema';
