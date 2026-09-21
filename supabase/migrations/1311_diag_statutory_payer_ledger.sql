-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner reports that marking a statutory challan as paid by another
-- account does NOT show up in that party's ledger, and asks why - for ESI, PF,
-- advance tax and GST. Measure it rather than reason from the migration files:
-- read what the LIVE view actually contains and how much is sitting behind it.

-- 1. Every kind of line the live party ledger can produce. If statutory
--    liabilities are not in here, a challan can never reach a party ledger.
SELECT source_table, count(*)::int AS lines,
       round(sum(debit))::int AS debit, round(sum(credit))::int AS credit
FROM public.v_party_ledger
GROUP BY source_table ORDER BY source_table;

-- 2. Statutory liabilities by type and by who paid them
SELECT liability_type,
       count(*)::int AS rows_total,
       count(*) FILTER (WHERE status = 'Paid')::int AS paid,
       count(*) FILTER (WHERE paid_via_party_id IS NOT NULL)::int AS via_party,
       count(*) FILTER (WHERE paid_via_partner_id IS NOT NULL)::int AS via_partner,
       count(*) FILTER (WHERE status = 'Paid' AND paid_via_party_id IS NULL
                          AND paid_via_partner_id IS NULL)::int AS own_bank,
       round(sum(COALESCE(amount_due,0)) FILTER (WHERE paid_via_party_id IS NOT NULL
             OR paid_via_partner_id IS NOT NULL))::int AS amount_via_others
FROM public.statutory_liabilities
GROUP BY liability_type ORDER BY liability_type;

-- 3. Who the other payers are, and how much has gone through each
SELECT COALESCE(p.name, pt.name || ' (partner)', '(unnamed)') AS payer,
       count(*)::int AS challans,
       min(sl.period)::text AS first_period,
       max(sl.period)::text AS last_period,
       round(sum(COALESCE(sl.amount_due,0)))::int AS total
FROM public.statutory_liabilities sl
LEFT JOIN public.parties  p  ON p.id  = sl.paid_via_party_id
LEFT JOIN public.partners pt ON pt.id = sl.paid_via_partner_id
WHERE sl.paid_via_party_id IS NOT NULL OR sl.paid_via_partner_id IS NOT NULL
GROUP BY 1 ORDER BY 5 DESC;

-- 4. What links a bank transaction to a party or partner, if anything
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_transactions'
  AND (column_name LIKE '%party%' OR column_name LIKE '%partner%'
       OR column_name LIKE '%statutory%' OR column_name LIKE '%liabilit%')
ORDER BY column_name;

-- 5. Is the other side of the arrangement recorded anywhere - i.e. does that
--    party carry a ledger balance at all today?
SELECT p.name,
       count(l.*)::int AS ledger_lines,
       round(COALESCE(sum(l.debit),0) - COALESCE(sum(l.credit),0))::int AS closing_balance
FROM public.parties p
LEFT JOIN public.v_party_ledger l ON l.party_id = p.id
WHERE p.id IN (SELECT DISTINCT paid_via_party_id FROM public.statutory_liabilities
               WHERE paid_via_party_id IS NOT NULL)
GROUP BY p.name ORDER BY p.name;
