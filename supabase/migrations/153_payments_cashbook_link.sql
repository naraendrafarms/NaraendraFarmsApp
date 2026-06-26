-- Migration 153: Link pending_payments to cash_book
-- Adds pending_payment_id to cash_book so payments auto-entry can be deduped.
-- Also adds invoice_no to pending_payments for better tracking.

ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS pending_payment_id UUID REFERENCES public.pending_payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_book_pending_payment_id
  ON public.cash_book(pending_payment_id) WHERE pending_payment_id IS NOT NULL;

ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS invoice_no TEXT;

-- Backfill invoice_no from grn table where grn_no matches
UPDATE public.pending_payments pp
SET invoice_no = g.invoice_no
FROM public.grn g
WHERE pp.grn_no = g.grn_no
  AND pp.invoice_no IS NULL
  AND g.invoice_no IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Done: pending_payment_id added to cash_book, invoice_no added to pending_payments';
END
$$;
