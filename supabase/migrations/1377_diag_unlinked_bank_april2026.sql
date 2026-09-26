-- READ ONLY. Corrects my own mistake in 1373.
--
-- 1373 reported unlinkedBank=0 and I told the owner there was nothing to link.
-- THAT WAS WRONG, and the reason is the query, not the data: it JOINED
-- bank_transactions to parties on b.party_id, so any imported bank row whose
-- party_id is NULL - the buyer's name sitting only in the narration - could
-- never appear in the count. "0" meant "none that already carry a party id",
-- not "none exist". The owner says the entries are there, from April 2026
-- onward, and that earlier bank data was never imported.
--
-- No party filter at all this time. Counted by what the row actually holds.

SELECT 'creditsSinceApr26=' || COUNT(*)
    || ' unlinked=' || COUNT(*) FILTER (WHERE he_dispatch_id IS NULL AND nhe_sale_id IS NULL)
    || ' unlinkedTot=' || COALESCE(ROUND(SUM(amount) FILTER (WHERE he_dispatch_id IS NULL AND nhe_sale_id IS NULL)/100000.0, 1), 0) || 'L'
    || ' noParty=' || COUNT(*) FILTER (WHERE party_id IS NULL)
    AS credits_since_april_2026
  FROM public.bank_transactions
 WHERE txn_type = 'Credit' AND txn_date >= '2026-04-01';

-- Do the unlinked ones name these buyers anywhere in the text?
SELECT 'mentionHitech=' || COUNT(*) FILTER (WHERE description ILIKE '%hitech%' OR reference_no ILIKE '%hitech%')
    || ' mentionJamal=' || COUNT(*) FILTER (WHERE description ILIKE '%jamal%' OR reference_no ILIKE '%jamal%')
    || ' named=' || COUNT(*) FILTER (WHERE party_id IS NOT NULL)
    || ' blankText=' || COUNT(*) FILTER (WHERE COALESCE(description,'') = '')
    AS unlinked_identification
  FROM public.bank_transactions
 WHERE txn_type = 'Credit' AND txn_date >= '2026-04-01'
   AND he_dispatch_id IS NULL AND nhe_sale_id IS NULL;

-- The biggest unlinked credits, so the owner can recognise them.
SELECT COALESCE(string_agg(x.line, ' ~ ' ORDER BY x.line DESC), 'none') AS top_unlinked
  FROM ( SELECT to_char(b.txn_date,'DD/MM') || '|' || ROUND(b.amount/100000.0, 1) || 'L|'
                || left(COALESCE(NULLIF(b.description,''), b.reference_no, '(no text)'), 26) AS line
           FROM public.bank_transactions b
          WHERE b.txn_type = 'Credit' AND b.txn_date >= '2026-04-01'
            AND b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL
          ORDER BY b.amount DESC LIMIT 6 ) x;

-- Is the settlement split table being used at all yet?
SELECT 'settlementRows=' || (SELECT COUNT(*)::int FROM public.bank_txn_settlements)
    || ' distinctTxns=' || (SELECT COUNT(DISTINCT bank_txn_id)::int FROM public.bank_txn_settlements)
    AS settlement_usage;

-- And the whole bank ledger, so the April cutoff the owner described is visible.
SELECT 'allCredits=' || COUNT(*)
    || ' earliest=' || COALESCE(MIN(txn_date)::text,'-')
    || ' latest=' || COALESCE(MAX(txn_date)::text,'-')
    || ' unlinkedAll=' || COUNT(*) FILTER (WHERE he_dispatch_id IS NULL AND nhe_sale_id IS NULL)
    AS whole_ledger
  FROM public.bank_transactions WHERE txn_type = 'Credit';
