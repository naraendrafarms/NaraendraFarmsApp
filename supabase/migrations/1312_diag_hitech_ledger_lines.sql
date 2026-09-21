-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- 1311 showed the party who pays our challans carries 4 ledger lines and a
-- balance, but none of those lines can be a challan because the party ledger
-- view has no statutory source. So what ARE those four lines, and is there
-- more than one record for this party? Needed before proposing anything.

-- 1. Every Hitech-named party, and what each carries in the ledger
SELECT p.name,
       count(l.*)::int AS lines,
       round(COALESCE(sum(l.debit),0))::int  AS debit,
       round(COALESCE(sum(l.credit),0))::int AS credit,
       round(COALESCE(sum(l.debit),0) - COALESCE(sum(l.credit),0))::int AS closing
FROM public.parties p
LEFT JOIN public.v_party_ledger l ON l.party_id = p.id
WHERE p.name ILIKE '%hitech%'
GROUP BY p.name ORDER BY p.name;

-- 2. The individual lines behind the payer's balance
SELECT COALESCE(string_agg(l.txn_type || ' ' || l.txn_date::text || ' Dr' ||
                round(l.debit)::int || ' Cr' || round(l.credit)::int ||
                ' [' || l.source_table || ']', ' | ' ORDER BY l.txn_date), 'none') AS lines
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.name ILIKE '%hitech%advance%';

-- 3. The four challans that party has paid, as recorded
SELECT sl.liability_type, sl.period::text AS period,
       round(COALESCE(sl.amount_due,0))::int AS amount,
       sl.status, COALESCE(sl.challan_no,'(none)') AS challan_no,
       sl.paid_date::text AS paid_date
FROM public.statutory_liabilities sl
WHERE sl.paid_via_party_id IS NOT NULL OR sl.paid_via_partner_id IS NOT NULL
ORDER BY sl.period, sl.liability_type;

-- 4. Is any bank transaction already tagged to a party or partner as funding
SELECT count(*)::int AS bank_rows,
       count(*) FILTER (WHERE partner_id IS NOT NULL)::int AS tagged_partner,
       count(*) FILTER (WHERE party_id IS NOT NULL)::int   AS tagged_party,
       count(*) FILTER (WHERE party_advance_id IS NOT NULL)::int AS tagged_party_advance
FROM public.bank_transactions;
