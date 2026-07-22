-- Diagnostic only (no schema changes) — checking whether the live
-- v_party_ledger view actually matches migration 472's definition
-- (Payment Made debit = paid_amount - advance_adjusted + discount_amount)
-- or is running an older, stale definition that ignores discount_amount.
SELECT pg_get_viewdef('public.v_party_ledger', true) AS view_definition;

-- Direct check on the Regen Biocorp bill itself
SELECT pp.id, pp.vendor_name, pp.invoice_no, pp.payment_status,
  pp.net_payable, pp.invoice_amount, pp.paid_amount, pp.discount_amount, pp.advance_adjusted
FROM public.pending_payments pp
WHERE pp.vendor_name ILIKE '%Regen Biocorp%';

SELECT 'sentinel' AS marker, 1 AS n;
