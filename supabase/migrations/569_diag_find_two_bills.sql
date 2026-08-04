-- Diagnostic only (no schema changes) — 568 found nothing for either vendor
-- in BOTH tables, including pending_payments, which must contain them (the
-- user is looking at them marked Paid). So the name patterns I guessed are
-- wrong. Searching by the amounts instead, which are unambiguous:
--   Dendi Srinath Reddy — Rent, ₹42,000, paid 05/07/2026
--   Om Prakash Singh — Professional Charges, ₹79,000 less ₹7,900 TDS
SELECT 'bill_by_amount' AS src, id, vendor_name, invoice_no, invoice_date,
  invoice_amount, tds_amount, net_payable, paid_amount, payment_status, party_id, category
FROM public.pending_payments
WHERE invoice_amount IN (42000, 79000)
ORDER BY invoice_amount, invoice_date;

SELECT 'invoice_by_amount' AS src, si.id, si.invoice_no, si.invoice_date, si.supplier_name,
  p.name AS party_name, si.total_amount, si.paid_amount, si.tds_amount, si.payment_status, si.source_type
FROM public.supplier_invoices si
LEFT JOIN public.parties p ON p.id = si.party_id
WHERE si.total_amount IN (42000, 79000)
ORDER BY si.total_amount, si.invoice_date;

-- Broader net: any vendor whose name contains these fragments, in either table
SELECT 'party_names' AS src, id, name, type FROM public.parties
WHERE name ILIKE '%srinath%' OR name ILIKE '%prakash%' OR name ILIKE '%dendi%'
ORDER BY name;

SELECT 'sentinel' AS marker, 1 AS n;
