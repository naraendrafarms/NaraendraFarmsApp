-- "GLOBAL CHEMICALS LIMITED" (id dc807f64...) and "Global Chemicals Limited"
-- (id f7e762b1...) are the SAME party (170e1e81...) and different GRNs
-- (2749 vs 2432) — two legitimate separate bills, just entered with
-- inconsistent casing. Normalize casing only; no rows touched/deleted.
UPDATE public.pending_payments
SET vendor_name = 'Global Chemicals Limited'
WHERE vendor_name = 'GLOBAL CHEMICALS LIMITED';

SELECT id, vendor_name, grn_no, invoice_amount, payment_status
FROM public.pending_payments
WHERE party_id = '170e1e81-2cf6-4261-b0a8-f4ef6f1309bb'
ORDER BY grn_no;
