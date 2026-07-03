-- 281's own verify SELECT printed 0 rows even though the backfill DO block
-- ran with no error. Check directly: did the pending_payments rows actually
-- get created for 2758-2761? Also check grn_no column type/format in case
-- of a comparison mismatch.

SELECT pg_typeof(grn_no) AS grn_no_type FROM public.grn LIMIT 1;

SELECT vendor_name, grn_no, invoice_amount, created_at
FROM public.pending_payments
ORDER BY created_at DESC LIMIT 6;

SELECT vendor_name, grn_no, invoice_amount FROM public.pending_payments
WHERE grn_no = ANY(ARRAY['2758','2759','2760','2761']);
