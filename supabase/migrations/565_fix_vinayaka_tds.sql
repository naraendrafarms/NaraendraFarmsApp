-- Corrects Vinayaka Enterprises' bill (Inv 370, GRN 2777) whose TDS was
-- saved as ₹714 (0.1% of the ₹7,14,168 gross) instead of the ₹664 actually
-- being deducted.
--
-- Cause (fixed in code this session, PendingPaymentsPage handleEditSave):
-- the save recomputed TDS from the rate whenever BOTH a % and an amount were
-- present ("% wins if both given"), so a manually-typed TDS amount could
-- never be saved while a rate was selected. An earlier fix this session only
-- stopped the % dropdown overwriting the field while typing — it missed this
-- second, save-time recomputation, which is why the problem reappeared on
-- other suppliers.
--
-- Setting tds_amount to the real ₹664 and net_payable to invoice − TDS.
-- tds_pct is recorded as the effective rate so it stays consistent with the
-- amount actually deducted.
UPDATE public.pending_payments
SET tds_amount = 664.00,
    tds_pct = ROUND((664.00 / invoice_amount) * 100, 4),
    net_payable = invoice_amount - 664.00
WHERE vendor_name ILIKE '%Vinayaka%' AND invoice_no = '370' AND grn_no = '2777';

-- Verify: net_payable should be 713504.00 (714168 − 664)
SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, tds_pct, tds_amount,
  net_payable, paid_amount, discount_amount, payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%Vinayaka%' AND invoice_no = '370' AND grn_no = '2777';

SELECT 'sentinel' AS marker, 1 AS n;
