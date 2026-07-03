-- User reports GRN 2812 (Olive Enterprises, Selvo BH, dated 02/07/2026)
-- shows as 01/07/2026 in Pending Payments (invoice OE/26-27/0294, amount
-- 9,702.00). Check the actual grn rows for grn_no 2812 and the vendor's
-- other same-invoice/grn_no rows, plus the matching pending_payments row.
SELECT g.grn_no, g.grn_date, g.invoice_no, g.invoice_date, g.item_name,
       g.total_amount, g.basic_amount, p.name AS vendor, g.created_at
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
WHERE p.name = 'Olive Enterprises'
ORDER BY g.created_at DESC
LIMIT 10;

SELECT vendor_name, grn_no, grn_date, invoice_no, invoice_date, invoice_amount, created_at
FROM public.pending_payments
WHERE vendor_name = 'Olive Enterprises'
ORDER BY created_at DESC
LIMIT 10;
