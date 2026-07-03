-- User is testing the fix: compare grn.grn_date (live, as entered/edited in
-- the GRN page) against pending_payments.grn_date for the same grn_no, to
-- confirm date edits are now propagating correctly.
SELECT g.grn_no, p.name AS vendor, g.grn_date AS grn_page_date,
       pp.grn_date AS pending_payments_date,
       (g.grn_date = pp.grn_date) AS dates_match
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
LEFT JOIN public.pending_payments pp
  ON pp.vendor_name = p.name AND pp.grn_no = g.grn_no
ORDER BY g.created_at DESC
LIMIT 15;
