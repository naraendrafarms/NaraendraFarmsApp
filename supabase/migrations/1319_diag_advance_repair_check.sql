-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner has opened the 16/06/2026 Rs 25,00,000 entry and ticked "Record as
-- a Vendor Advance". Check what the app actually did: one advance created and
-- not two, the bank row linked to it, no orphan left, and what the party
-- ledger now closes at.
--
-- Expected if it worked: advances 38, that bank row linked, orphans 0, and
-- Hitech Hatch Fresh Private Limited Advance at Dr 74,20,376 less
-- Cr 52,61,390 = 21,58,986.

-- 1. The bank row itself, and how many advances point at it
SELECT b.txn_date::text AS txn_date,
       round(b.amount)::int AS amount,
       COALESCE(b.reference_no,'-') AS ref_no,
       b.category,
       CASE WHEN b.vendor_advance_id IS NULL THEN 'STILL NOT LINKED' ELSE 'linked' END AS state,
       (SELECT count(*)::int FROM public.vendor_advances va
        WHERE va.party_id = b.party_id AND va.advance_date = b.txn_date
          AND va.amount = b.amount) AS advances_matching_this_payment
FROM public.bank_transactions b
WHERE b.id = 'd884839f-c117-473f-8969-3eebd07e9bed';

-- 2. Counts: an advance should have been added, and no orphan should remain
SELECT (SELECT count(*)::int FROM public.vendor_advances) AS advances_total,
       (SELECT count(*)::int FROM public.bank_transactions WHERE vendor_advance_id IS NOT NULL) AS bank_rows_linked,
       (SELECT count(*)::int FROM public.bank_transactions WHERE category = 'Vendor Advance') AS bank_rows_labelled,
       (SELECT count(*)::int FROM public.bank_transactions
        WHERE category = 'Vendor Advance' AND vendor_advance_id IS NULL) AS orphans_left,
       (SELECT count(*)::int FROM public.vendor_advances WHERE created_at >= (now() - interval '2 hours')) AS created_last_2h;

-- 3. The party ledger as it now stands
SELECT p.name,
       count(*)::int AS lines,
       count(*) FILTER (WHERE l.source_table = 'vendor_advance')::int AS advance_lines,
       round(sum(l.debit))::int AS debit,
       round(sum(l.credit))::int AS credit,
       round(sum(l.debit) - sum(l.credit))::int AS closing
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.name ILIKE '%hitech%advance%'
GROUP BY p.name;

-- 4. Every advance line for that party, so a duplicate would be obvious
SELECT COALESCE(string_agg(l.txn_date::text || ' ' || round(l.debit)::int, ' | '
                ORDER BY l.txn_date), 'none') AS advance_lines
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.name ILIKE '%hitech%advance%' AND l.source_table = 'vendor_advance';
