-- User merged duplicate supplier records via the Parties merge tool. That
-- merge (MastersPages.tsx mergeMut) updates grn.party_id but never touches
-- pending_payments directly. fn_grn_to_payment then upserts under the NEW
-- vendor name (from the merged party), leaving the OLD-named pending_payments
-- row behind as an orphan — same grn_no, two different vendor_name strings.
-- Editing the stale row to the correct name then collides with the
-- unique constraint. Find every grn_no that now has more than one
-- pending_payments row (i.e. under different vendor_name spellings).
SELECT grn_no, COUNT(*) AS row_count,
       array_agg(vendor_name) AS vendor_names,
       array_agg(invoice_amount) AS amounts,
       array_agg(payment_status) AS statuses,
       array_agg(id::text) AS ids
FROM public.pending_payments
WHERE grn_no IS NOT NULL
GROUP BY grn_no
HAVING COUNT(*) > 1
ORDER BY grn_no;
