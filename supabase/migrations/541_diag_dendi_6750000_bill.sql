-- Diagnostic only (no schema changes) — 540 confirmed Dendi Naraendra Reddy
-- DOES have a real parties row (84460852..., type=supplier) linked via
-- partner_id too, and showed 5 pending_payments rows total but the log
-- truncated after 2. Checking specifically whether a pending_payments row
-- exists for the ₹67,50,000 opening balance (opening_balances.id =
-- 3be7ada5-761b-483e-a1d5-91a642db5d06) — if not, this is the same
-- orphaned-opening-balance bug pattern already fixed once this session
-- (migration 526, Amit Das) for a save that predates that fix.
SELECT id, vendor_name, invoice_no, party_id, partner_id, is_opening, opening_balance_id,
  payment_status, net_payable, paid_amount, discount_amount, invoice_date
FROM public.pending_payments
WHERE opening_balance_id = '3be7ada5-761b-483e-a1d5-91a642db5d06'
   OR net_payable = 6750000;

SELECT 'sentinel' AS marker, 1 AS n;
