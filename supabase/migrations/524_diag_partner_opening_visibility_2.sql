-- Diagnostic only (no schema changes) — narrower columns to avoid the
-- previous query's log line getting truncated mid-JSON.
SELECT vendor_name, party_id IS NOT NULL AS has_party_id, partner_id IS NOT NULL AS has_partner_id,
  invoice_no, invoice_amount, payment_status, is_opening
FROM public.pending_payments
WHERE vendor_name IN ('Radheshyam Roy', 'Amit Das')
ORDER BY vendor_name, invoice_no;

SELECT 'sentinel' AS marker, 1 AS n;
