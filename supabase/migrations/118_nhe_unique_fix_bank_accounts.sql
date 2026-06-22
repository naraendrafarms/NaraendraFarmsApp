-- Migration 118: Drop over-restrictive nhe_sales unique constraint
-- The old constraint (flock_id, sale_date, dc_no, party_id, quantity) blocks
-- multi-line vouchers where the same-day quantity could coincidentally match.
-- invoice_no already provides natural deduplication for proper vouchers.

ALTER TABLE public.nhe_sales
  DROP CONSTRAINT IF EXISTS nhe_sales_unique;

-- Add a softer constraint: same invoice_no can't appear twice (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_nhe_sales_invoice_no
  ON public.nhe_sales(invoice_no)
  WHERE invoice_no IS NOT NULL;

-- Add bank accounts for payment receipt
INSERT INTO public.bank_accounts (bank_name, account_name, account_no, ifsc_code, is_active)
VALUES
  ('Kotak Mahindra Bank', 'Kotak Mahindra Bank', NULL, NULL, true),
  ('Partner Account', 'Dendi Naraendra Reddy Partner Account', NULL, NULL, true)
ON CONFLICT DO NOTHING;

-- Diagnostic
SELECT id, bank_name, account_name, is_active FROM public.bank_accounts ORDER BY created_at;

NOTIFY pgrst, 'reload schema';
