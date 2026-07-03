-- Direct check: do pending_payments rows exist for the 4 GRNs that appear
-- unsynced (2758-2761)? And are their party_id's pointing to the SAME
-- parties row as the older, working GRN 2757?
SELECT pp.grn_no, pp.vendor_name, pp.invoice_amount, pp.created_at
FROM public.pending_payments pp
WHERE pp.grn_no IN ('2758','2759','2760','2761','2757');

SELECT g.grn_no, g.party_id, p.name, p.id AS party_row_id, g.total_amount, g.basic_amount, g.farm_id
FROM public.grn g LEFT JOIN public.parties p ON p.id = g.party_id
WHERE g.grn_no IN ('2758','2759','2760','2761','2757');

SELECT id, name, credit_days FROM public.parties WHERE name = 'Sai Santhoshini Traders';
