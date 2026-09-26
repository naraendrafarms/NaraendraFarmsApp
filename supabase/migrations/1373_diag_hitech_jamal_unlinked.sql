-- READ ONLY. Nothing is written or linked. This only measures.
--
-- The owner asks whether Hitech Hatch Fresh Private Limited and Jamal Agro
-- Industries Private Limited sales on Flocks 19 and 20 are linked to the money
-- actually received, allowing for TDS deducted at source.
--
-- flocks.flock_no is TEXT (migration 001). Comparing it to a bare 19 raises
-- "operator does not exist", which run_sql.py SWALLOWS as success - that is
-- exactly how migration 1337 did nothing at all and still reported Errors: 0.
-- So the values are quoted.

SELECT 'parties=' || COUNT(*) || ' -> ' || COALESCE(string_agg(name || ' [' || left(id::text, 8) || ']', ' ~ ' ORDER BY name), 'none')
    AS matched_parties
  FROM public.parties
 WHERE name ILIKE '%hitech%' OR name ILIKE '%jamal%';

-- What those two buyers were invoiced on Flocks 19 and 20, and what the app
-- believes has been received.
SELECT 'heInvoices=' || COUNT(*)
    || ' amount=' || COALESCE(ROUND(SUM(d.amount)::numeric, 2), 0)
    || ' tds=' || COALESCE(ROUND(SUM(COALESCE(d.tds_amount, 0))::numeric, 2), 0)
    || ' received=' || COALESCE(ROUND(SUM(COALESCE(d.amount_received, 0))::numeric, 2), 0)
    || ' stillDue=' || COALESCE(ROUND(SUM(d.amount - COALESCE(d.amount_received, 0))::numeric, 2), 0)
    || ' unpaidRows=' || COUNT(*) FILTER (WHERE COALESCE(d.amount_received, 0) < 0.005)
    AS he_dispatch_position
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
   AND f.flock_no IN ('19','20')
   AND COALESCE(d.amount, 0) > 0;

-- Money from those buyers sitting in the bank ledger attached to NO voucher.
-- These are the candidates for linking.
SELECT 'unlinkedBank=' || COUNT(*)
    || ' total=' || COALESCE(ROUND(SUM(b.amount)::numeric, 2), 0)
    || ' from=' || COALESCE(MIN(b.txn_date)::text, '-')
    || ' to=' || COALESCE(MAX(b.txn_date)::text, '-')
    AS unlinked_bank_credits
  FROM public.bank_transactions b
  JOIN public.parties p ON p.id = b.party_id
 WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
   AND b.txn_type = 'Credit'
   AND b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL;

-- For contrast: how much of their money IS already linked to a voucher.
SELECT 'linkedBank=' || COUNT(*)
    || ' total=' || COALESCE(ROUND(SUM(b.amount)::numeric, 2), 0)
    AS linked_bank_credits
  FROM public.bank_transactions b
  JOIN public.parties p ON p.id = b.party_id
 WHERE (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%')
   AND b.txn_type = 'Credit'
   AND (b.he_dispatch_id IS NOT NULL OR b.nhe_sale_id IS NOT NULL);

-- Cash book carries a NAME rather than a party id, so it is matched by text.
SELECT 'unlinkedCash=' || COUNT(*)
    || ' total=' || COALESCE(ROUND(SUM(c.amount_in)::numeric, 2), 0)
    AS unlinked_cash_receipts
  FROM public.cash_book c
 WHERE (c.party_name ILIKE '%hitech%' OR c.party_name ILIKE '%jamal%')
   AND COALESCE(c.amount_in, 0) > 0
   AND c.he_dispatch_id IS NULL AND c.nhe_sale_id IS NULL;
