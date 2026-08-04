-- Diagnostic only (no schema changes) — 567's verification matched only on
-- supplier_invoices.supplier_name and returned 0 rows for both vendors. That
-- does NOT prove the backfill worked: these invoices may store the vendor via
-- party_id (with supplier_name NULL), or may not exist in the register at
-- all. Looking them up through BOTH the party link and the free-text name.

-- 1. Invoices for these vendors, resolved via party_id as well as supplier_name
SELECT si.id, si.invoice_no, si.invoice_date, si.supplier_name, p.name AS party_name,
  si.total_amount, si.paid_amount, si.tds_amount, si.payment_status
FROM public.supplier_invoices si
LEFT JOIN public.parties p ON p.id = si.party_id
WHERE si.supplier_name ILIKE '%Dendi%Srinath%' OR si.supplier_name ILIKE '%Om Prakash%'
   OR p.name ILIKE '%Dendi%Srinath%' OR p.name ILIKE '%Om Prakash%'
ORDER BY si.invoice_date;

-- 2. The corresponding bills in Pending Payments (these definitely exist —
--    the user is looking at them showing Paid)
SELECT pp.id, pp.vendor_name, pp.invoice_no, pp.invoice_date, pp.party_id,
  pp.invoice_amount, pp.tds_amount, pp.net_payable, pp.paid_amount, pp.payment_status
FROM public.pending_payments pp
WHERE pp.vendor_name ILIKE '%Dendi%Srinath%' OR pp.vendor_name ILIKE '%Om Prakash%'
ORDER BY pp.invoice_date;

-- 3. Does ANY supplier_invoices row exist with these invoice numbers,
--    regardless of vendor? (catches a vendor-name mismatch between the two
--    tables, which is what would make the backfill's join miss.)
SELECT si.id, si.invoice_no, si.supplier_name, si.party_id, si.total_amount, si.payment_status
FROM public.supplier_invoices si
WHERE si.invoice_no IN ('003', 'Professional Charges')
ORDER BY si.invoice_no;

SELECT 'sentinel' AS marker, 1 AS n;
