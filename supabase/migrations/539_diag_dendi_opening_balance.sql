-- Diagnostic only (no schema changes) — user reports Dendi Naraendra
-- Reddy's opening balance (₹67,50,000) isn't showing up when trying to
-- add a Bank Ledger transaction against it. Bank Ledger's Add Transaction
-- party picker only reads from the `parties` table and only shows a bill
-- to pay (Debit) if a matching pending_payments row exists with a
-- party_id. Checking whether Dendi is a party or a partner, his opening
-- balance's Dr/Cr, and whether a pending_payments row actually links to it.

SELECT 'as party' AS src, id, name, type, is_active FROM public.parties WHERE name ILIKE '%Dendi%Naraendra%';
SELECT 'as partner' AS src, id, name FROM public.partners WHERE name ILIKE '%Dendi%Naraendra%';

SELECT ob.id, ob.fy, ob.amount, ob.dr_cr, ob.party_id, ob.partner_id, ob.remarks, ob.as_of_date
FROM public.opening_balances ob
LEFT JOIN public.parties p ON p.id = ob.party_id
LEFT JOIN public.partners pt ON pt.id = ob.partner_id
WHERE COALESCE(p.name,'') ILIKE '%Dendi%Naraendra%' OR COALESCE(pt.name,'') ILIKE '%Dendi%Naraendra%';

SELECT pp.id, pp.vendor_name, pp.invoice_no, pp.party_id, pp.partner_id, pp.is_opening, pp.payment_status, pp.net_payable, pp.paid_amount
FROM public.pending_payments pp
WHERE pp.vendor_name ILIKE '%Dendi%Naraendra%' OR pp.is_opening = TRUE AND (pp.party_id IN (SELECT id FROM public.parties WHERE name ILIKE '%Dendi%Naraendra%') OR pp.partner_id IN (SELECT id FROM public.partners WHERE name ILIKE '%Dendi%Naraendra%'));

SELECT 'sentinel' AS marker, 1 AS n;
