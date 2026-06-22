-- Migration 134: Purchase & Payments structural improvements
-- Adds GST breakdown columns to pending_payments so Equipment/Other purchases
-- store full GST detail in the same table as Feed/Medicine.

ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS basic_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS gst_pct      NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS category     TEXT,      -- Feed / Medicine / Equipment / Other
  ADD COLUMN IF NOT EXISTS paid_amount  NUMERIC(14,2) DEFAULT 0;

-- pending_payments.paid_amount already added in migration 133 as well,
-- so use IF NOT EXISTS to be safe (idempotent).

-- Unique constraint so InvoiceRegister can upsert by (vendor_name, invoice_no)
ALTER TABLE public.pending_payments
  DROP CONSTRAINT IF EXISTS uq_pending_payments_vendor_invoice;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_pending_payments_vendor_invoice'
      AND conrelid = 'public.pending_payments'::regclass
  ) THEN
    ALTER TABLE public.pending_payments
      ADD CONSTRAINT uq_pending_payments_vendor_invoice UNIQUE (vendor_name, invoice_no);
  END IF;
END $$;

-- Diagnostic
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pending_payments'
   AND column_name='basic_amount') AS basic_amount_col,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pending_payments'
   AND column_name='category') AS category_col;
