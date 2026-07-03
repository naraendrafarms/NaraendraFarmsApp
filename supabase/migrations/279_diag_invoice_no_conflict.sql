-- Theory: pending_payments has TWO unique constraints —
--   pending_payments_unique (vendor_name, grn_no)              [migration 015]
--   uq_pending_payments_vendor_invoice (vendor_name, invoice_no) [migration 134]
-- fn_grn_to_payment's INSERT ... ON CONFLICT (vendor_name, grn_no) only
-- handles the first. If invoice_no collides with an existing pending_payments
-- row under the same vendor (reused/split invoice number), the INSERT throws
-- unique_violation on the SECOND constraint, which ON CONFLICT does not
-- catch — it's a real error, silently swallowed by EXCEPTION WHEN OTHERS.

SELECT grn_no, invoice_no, invoice_date, party_id
FROM public.grn
WHERE grn_no IN ('2757','2758','2759','2760','2761')
ORDER BY grn_no;

SELECT vendor_name, grn_no, invoice_no, invoice_amount
FROM public.pending_payments
WHERE vendor_name = 'Sai Santhoshini Traders'
  AND invoice_no IN (SELECT invoice_no FROM public.grn WHERE grn_no IN ('2758','2759','2760','2761'));
