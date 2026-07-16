-- Venco's pending_payments rows had paid_amount already set equal to
-- net_payable (or invoice_amount) even though nothing was actually paid —
-- no cash_book/bank_transactions entry, no advance_adjusted, no
-- vendor_advance_id, and payment_status still 'Pending'. This made
-- getBalance() compute to zero, hiding the Pay button entirely. Reset
-- paid_amount to 0 so these bills show their real outstanding balance
-- and can be settled properly (via the Venco advance or a real payment).
-- Scoped tightly: only rows where nothing else indicates a real
-- part-payment happened (advance_adjusted=0, vendor_advance_id IS NULL,
-- payment_status <> 'Paid', paid_amount matches net_payable/invoice_amount
-- exactly — i.e. the exact "phantom full payment" pattern, not a genuine
-- partial payment).
UPDATE public.pending_payments
SET paid_amount = 0
WHERE vendor_name ILIKE '%Venco%'
  AND payment_status <> 'Paid'
  AND COALESCE(advance_adjusted, 0) = 0
  AND vendor_advance_id IS NULL
  AND paid_amount = COALESCE(net_payable, invoice_amount, 0);

-- How widespread is this same "phantom paid_amount" pattern across ALL
-- vendors (not just Venco)? Diagnostic only — no other rows are touched
-- here, this is purely to size up whether a broader fix is needed.
SELECT count(*) AS other_vendors_same_pattern
FROM public.pending_payments
WHERE vendor_name NOT ILIKE '%Venco%'
  AND payment_status <> 'Paid'
  AND COALESCE(advance_adjusted, 0) = 0
  AND vendor_advance_id IS NULL
  AND paid_amount = COALESCE(net_payable, invoice_amount, 0)
  AND COALESCE(net_payable, invoice_amount, 0) > 0;

-- Confirm the Venco reset worked
SELECT count(*) AS venco_rows_reset FROM public.pending_payments
  WHERE vendor_name ILIKE '%Venco%' AND paid_amount = 0 AND payment_status <> 'Paid';
