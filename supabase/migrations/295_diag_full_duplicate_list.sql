-- 294's aggregated JSON preview truncated at 600 chars, hiding 4 of the 6
-- flagged grn_no groups. Also GRN 2447 showed two DIFFERENT vendors with
-- different amounts sharing a grn_no by coincidence — that is NOT a merge
-- duplicate and must not be touched. List one row per (grn_no, vendor_name)
-- for every flagged grn_no, plus each row's party_id, so we can tell real
-- merge leftovers (same/similar name, same amount) from coincidental
-- grn_no reuse across unrelated vendors.
-- run_sql.py's preview only ever shows the first 5 array elements of a
-- single statement's result, regardless of JSON size, and (per project
-- convention) only SELECT-prefixed statements are guaranteed to print — so
-- page through in batches of 4 using SELECT-prefixed subqueries.
SELECT * FROM (
  SELECT pp.grn_no, pp.vendor_name, pp.party_id, pp.invoice_amount, pp.payment_status, pp.id
  FROM public.pending_payments pp
  WHERE pp.grn_no IN (
    SELECT grn_no FROM public.pending_payments WHERE grn_no IS NOT NULL
    GROUP BY grn_no HAVING COUNT(*) > 1
  )
  ORDER BY pp.grn_no, pp.vendor_name
) x LIMIT 4 OFFSET 0;

SELECT * FROM (
  SELECT pp.grn_no, pp.vendor_name, pp.party_id, pp.invoice_amount, pp.payment_status, pp.id
  FROM public.pending_payments pp
  WHERE pp.grn_no IN (
    SELECT grn_no FROM public.pending_payments WHERE grn_no IS NOT NULL
    GROUP BY grn_no HAVING COUNT(*) > 1
  )
  ORDER BY pp.grn_no, pp.vendor_name
) x LIMIT 4 OFFSET 4;

SELECT * FROM (
  SELECT pp.grn_no, pp.vendor_name, pp.party_id, pp.invoice_amount, pp.payment_status, pp.id
  FROM public.pending_payments pp
  WHERE pp.grn_no IN (
    SELECT grn_no FROM public.pending_payments WHERE grn_no IS NOT NULL
    GROUP BY grn_no HAVING COUNT(*) > 1
  )
  ORDER BY pp.grn_no, pp.vendor_name
) x LIMIT 4 OFFSET 8;
