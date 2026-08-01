-- Repairs the orphaned ₹67,50,000 opening balance for Dendi Naraendra
-- Reddy (opening_balances.id = 3be7ada5-761b-483e-a1d5-91a642db5d06,
-- partner_id = f356073d-d57d-4581-a943-74a524126e45, dr_cr = Cr, fy
-- 2026-27) — its linked pending_payments bill never got created, so it
-- had nothing to be paid against anywhere (Bank Ledger, Pending
-- Payments, etc). Creating it now, mirroring the structure of his other
-- (already-working, already-paid) opening balance bill 'OPENING-2026-27'
-- — same party_id=NULL/partner_id link so Bank Ledger's vendor-name
-- fallback match against his party record ("Dendi Naraendra Reddy",
-- id 84460852) picks it up correctly.
INSERT INTO public.pending_payments (
  vendor_name, party_id, partner_id, is_opening, opening_balance_id,
  invoice_no, invoice_amount, net_payable,
  invoice_date, grn_date, pay_before_date,
  payment_type, payment_status, po_raised_by
)
SELECT
  'Dendi Naraendra Reddy', NULL, 'f356073d-d57d-4581-a943-74a524126e45',
  TRUE, '3be7ada5-761b-483e-a1d5-91a642db5d06',
  'OPENING-2026-27-3be7ada5', 6750000.00, 6750000.00,
  '2026-04-01', '2026-04-01', '2026-04-01',
  'NEFT', 'Pending', 'Opening'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pending_payments WHERE opening_balance_id = '3be7ada5-761b-483e-a1d5-91a642db5d06'
);

-- Verify: should show exactly one row, Pending, net_payable 6750000
SELECT id, vendor_name, invoice_no, party_id, partner_id, payment_status, net_payable
FROM public.pending_payments
WHERE opening_balance_id = '3be7ada5-761b-483e-a1d5-91a642db5d06';

SELECT 'sentinel' AS marker, 1 AS n;
