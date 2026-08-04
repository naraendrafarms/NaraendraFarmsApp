-- Adds TDS to Purchase Invoice Register (supplier_invoices).
--
-- Problem: the register had no concept of TDS, so it computed
--   Balance = total_amount − paid_amount
-- A ₹79,000 invoice with ₹7,900 TDS is fully settled once ₹71,100 is paid
-- (71,100 paid + 7,900 deducted at source = 79,000), but the register showed
-- ₹7,900 still outstanding — treating the tax deducted as unpaid money.
--
-- Storing tds_amount here lets the register net it off:
--   Balance = total_amount − paid_amount − tds_amount
-- and lets TDS entered on either side (here, or on the mirrored bill in
-- Pending Payments) stay in agreement.
ALTER TABLE public.supplier_invoices ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(14,2) DEFAULT 0;

-- Backfill from the mirrored pending_payments bill, so invoices that already
-- had TDS recorded on the bill side stop showing a phantom balance.
UPDATE public.supplier_invoices si
SET tds_amount = pp.tds_amount
FROM public.pending_payments pp
WHERE COALESCE(si.tds_amount, 0) = 0
  AND COALESCE(pp.tds_amount, 0) > 0
  AND pp.invoice_no = si.invoice_no
  AND (
    (si.party_id IS NOT NULL AND pp.party_id = si.party_id)
    OR LOWER(TRIM(COALESCE(pp.vendor_name,''))) = LOWER(TRIM(COALESCE(si.supplier_name,'')))
  );

-- Verify: column exists, plus how many invoices picked up a TDS value
SELECT 'column' AS chk, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='supplier_invoices' AND column_name='tds_amount';

SELECT 'backfilled' AS chk, COUNT(*) AS invoices_with_tds
FROM public.supplier_invoices WHERE COALESCE(tds_amount,0) > 0;

SELECT 'sentinel' AS marker, 1 AS n;
