-- READ ONLY. Tests the real hypothesis.
--
-- The owner says a single bank credit often CLUBS TWO invoices, spanning Flock
-- 19 and Flock 20. bank_transactions carries only ONE he_dispatch_id, so such a
-- credit can name only the FIRST invoice - the second never receives its share
-- and stays outstanding, which is exactly what Party Outstanding is showing.
-- bank_txn_settlements (1321) exists to record the rest, but it holds only 35
-- rows across 19 transactions while Hitech alone has 59 credits.
--
-- So: for every LINKED credit from these buyers, is the credit BIGGER than the
-- net balance of the single invoice it names? That excess is money already in
-- the bank that no invoice has been given credit for.

SELECT 'linkedHeCredits=' || COUNT(*)
    || ' biggerThanInvoice=' || COUNT(*) FILTER (WHERE b.amount > (d.amount - COALESCE(d.tds_amount,0)) + 1)
    || ' excessTot=' || COALESCE(ROUND(SUM(GREATEST(b.amount - (d.amount - COALESCE(d.tds_amount,0)), 0))/100000.0, 1), 0) || 'L'
    AS clubbed_shortfall
  FROM public.bank_transactions b
  JOIN public.he_dispatch d ON d.id = b.he_dispatch_id
  JOIN public.parties p ON p.id = b.party_id
 WHERE b.txn_type = 'Credit'
   AND (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%');

-- How many of those credits have settlement rows recording the full story, and
-- how many have none at all.
SELECT 'creditsWithSettlements=' || COUNT(*) FILTER (WHERE s.n > 0)
    || ' withoutAny=' || COUNT(*) FILTER (WHERE COALESCE(s.n,0) = 0)
    || ' totalCredits=' || COUNT(*)
    AS settlement_coverage
  FROM public.bank_transactions b
  JOIN public.parties p ON p.id = b.party_id
  LEFT JOIN ( SELECT bank_txn_id, COUNT(*) AS n
                FROM public.bank_txn_settlements GROUP BY bank_txn_id ) s
         ON s.bank_txn_id = b.id
 WHERE b.txn_type = 'Credit'
   AND (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%');

-- settled_amount is the column the edit screen shows. Where it is LESS than the
-- credit, money on that row has not been applied to anything.
SELECT 'creditsTot=' || ROUND(SUM(b.amount)/10000000.0, 2) || 'Cr'
    || ' settledTot=' || ROUND(SUM(COALESCE(b.settled_amount,0))/10000000.0, 2) || 'Cr'
    || ' unapplied=' || ROUND(SUM(GREATEST(b.amount - COALESCE(b.settled_amount,0), 0))/10000000.0, 2) || 'Cr'
    AS applied_vs_received
  FROM public.bank_transactions b
  JOIN public.parties p ON p.id = b.party_id
 WHERE b.txn_type = 'Credit'
   AND (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%');

-- Sanity: the invoices those credits point at - are they marked fully received?
SELECT 'namedInvoices=' || COUNT(DISTINCT d.id)
    || ' stillPartial=' || COUNT(DISTINCT d.id) FILTER (WHERE d.payment_status = 'Partial')
    || ' stillPending=' || COUNT(DISTINCT d.id) FILTER (WHERE d.payment_status = 'Pending' OR d.payment_status IS NULL)
    AS named_invoice_state
  FROM public.bank_transactions b
  JOIN public.he_dispatch d ON d.id = b.he_dispatch_id
  JOIN public.parties p ON p.id = b.party_id
 WHERE b.txn_type = 'Credit'
   AND (p.name ILIKE '%hitech%' OR p.name ILIKE '%jamal%');
