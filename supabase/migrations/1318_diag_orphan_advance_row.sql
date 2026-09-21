-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
-- 1317 found exactly one bank row labelled Vendor Advance with no advance
-- record behind it, worth Rs 25,00,000. Which row, and against whom.

SELECT b.id::text AS bank_txn_id,
       b.txn_date::text AS txn_date,
       COALESCE(p.name, '(no party set)') AS party,
       b.txn_type,
       round(b.amount)::int AS amount,
       COALESCE(b.reference_no,'-') AS ref_no,
       COALESCE(b.description,'-') AS description,
       COALESCE(ba.bank_name, ba.account_name, '-') AS bank_account
FROM public.bank_transactions b
LEFT JOIN public.parties p ON p.id = b.party_id
LEFT JOIN public.bank_accounts ba ON ba.id = b.bank_account_id
WHERE b.category = 'Vendor Advance' AND b.vendor_advance_id IS NULL;

-- And what that party's ledger holds today, so the effect of the missing
-- advance record is plain.
SELECT p.name,
       count(*)::int AS lines,
       round(sum(l.debit))::int AS debit,
       round(sum(l.credit))::int AS credit,
       round(sum(l.debit) - sum(l.credit))::int AS closing
FROM public.v_party_ledger l
JOIN public.parties p ON p.id = l.party_id
WHERE p.id IN (SELECT party_id FROM public.bank_transactions
               WHERE category = 'Vendor Advance' AND vendor_advance_id IS NULL
                 AND party_id IS NOT NULL)
GROUP BY p.name;

-- The statutory challans against that party, since the ledger moved today.
SELECT sl.liability_type, sl.period::text AS period,
       round(COALESCE(sl.amount_paid, sl.amount_due))::int AS credited,
       sl.status, COALESCE(sl.challan_no,'-') AS challan_no
FROM public.statutory_liabilities sl
WHERE sl.paid_via_party_id IS NOT NULL
ORDER BY sl.period, sl.liability_type;
