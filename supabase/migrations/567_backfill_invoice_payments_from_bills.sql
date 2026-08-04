-- Backfills Purchase Invoice Register from already-paid bills.
--
-- Until today the sync was one-way: an invoice recorded in the register was
-- mirrored INTO pending_payments, but paying that bill (Pay / Bulk Pay /
-- Edit Bill / Bank Ledger link) never wrote anything back. So every invoice
-- paid before that fix still shows Unpaid/Pending in the register even
-- though the bill is settled — e.g. Dendi Srinath Reddy (Rent, ₹42,000) and
-- Om Prakash Singh (Professional Charges, ₹79,000 less ₹7,900 TDS).
--
-- Copies paid_amount + tds_amount across and recomputes the invoice status,
-- counting TDS and discount as settling the invoice (they clear it without
-- cash moving). Matched on invoice_no PLUS party or supplier name — never
-- the number alone, since invoice numbers are only unique per vendor.
UPDATE public.supplier_invoices si
SET paid_amount = COALESCE(pp.paid_amount, 0),
    tds_amount  = GREATEST(COALESCE(si.tds_amount, 0), COALESCE(pp.tds_amount, 0)),
    payment_status = CASE
      WHEN COALESCE(si.total_amount, 0) > 0
       AND COALESCE(pp.paid_amount,0) + GREATEST(COALESCE(si.tds_amount,0), COALESCE(pp.tds_amount,0)) + COALESCE(pp.discount_amount,0)
           >= COALESCE(si.total_amount,0) - 0.5
        THEN 'paid'
      WHEN COALESCE(pp.paid_amount, 0) > 0 THEN 'partial'
      ELSE si.payment_status
    END
FROM public.pending_payments pp
WHERE pp.invoice_no = si.invoice_no
  AND (
    (si.party_id IS NOT NULL AND pp.party_id = si.party_id)
    OR LOWER(TRIM(COALESCE(pp.vendor_name,''))) = LOWER(TRIM(COALESCE(si.supplier_name,'')))
  )
  AND COALESCE(pp.paid_amount, 0) > 0
  AND (
    COALESCE(si.paid_amount, 0) <> COALESCE(pp.paid_amount, 0)
    OR COALESCE(si.tds_amount, 0) < COALESCE(pp.tds_amount, 0)
    OR si.payment_status <> 'paid'
  );

-- Verify 1: the two invoices reported by the user
SELECT si.invoice_no, si.supplier_name, si.total_amount, si.paid_amount, si.tds_amount,
  (COALESCE(si.total_amount,0) - COALESCE(si.paid_amount,0) - COALESCE(si.tds_amount,0)) AS balance,
  si.payment_status
FROM public.supplier_invoices si
WHERE si.supplier_name ILIKE '%Dendi Srinath%' OR si.supplier_name ILIKE '%Om Prakash%'
ORDER BY si.supplier_name;

-- Verify 2: any invoice still showing unpaid/partial while its bill is fully
-- paid — should be 0 rows once the backfill has done its job.
SELECT si.invoice_no, si.supplier_name, si.total_amount, si.paid_amount, si.payment_status,
  pp.paid_amount AS bill_paid, pp.payment_status AS bill_status
FROM public.supplier_invoices si
JOIN public.pending_payments pp
  ON pp.invoice_no = si.invoice_no
 AND ((si.party_id IS NOT NULL AND pp.party_id = si.party_id)
      OR LOWER(TRIM(COALESCE(pp.vendor_name,''))) = LOWER(TRIM(COALESCE(si.supplier_name,''))))
WHERE pp.payment_status = 'Paid' AND si.payment_status <> 'paid';

SELECT 'sentinel' AS marker, 1 AS n;
