-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- 1323 matched the bank reference_no (the UTR, e.g. FCM-260602N96MCG) against
-- invoice numbers and found nothing. That was the WRONG KEY: the DC number
-- lives in the DESCRIPTION - "HE Egg Sale - F-20 - 4639" - not in the
-- reference. Match on that instead.
--
-- Seven unlinked receipts worth Rs 1,19,99,545 hang on this, so the question
-- is not "can they be linked" but "SHOULD they be": if the dispatch they point
-- at is already marked Received, these seven are duplicates and linking them
-- would double-count a crore of receipts. Nothing is written here.

WITH unl AS (
  SELECT b.id, b.txn_date, b.amount, b.reference_no, b.description, b.party_id,
         (regexp_match(b.description, '([0-9]+)\s*$'))[1] AS dc_txt
  FROM public.bank_transactions b
  WHERE b.description ILIKE 'HE Egg Sale%'
    AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
)
SELECT u.txn_date::text AS txn_date,
       u.dc_txt AS dc_no,
       round(u.amount)::int AS receipt,
       CASE WHEN d.id IS NULL THEN 'NO DISPATCH' ELSE 'found' END AS dispatch,
       round(d.amount)::int AS dispatch_amount,
       round(COALESCE(d.amount_received,0))::int AS already_received,
       COALESCE(d.payment_status,'(never set)') AS status,
       (SELECT count(*)::int FROM public.bank_transactions b2
        WHERE b2.he_dispatch_id = d.id) AS receipts_already_linked
FROM unl u
LEFT JOIN public.he_dispatch d ON d.dc_no::text = u.dc_txt
ORDER BY u.txn_date;

-- Totals, so the size of what a fix would touch is plain
WITH unl AS (
  SELECT b.amount, (regexp_match(b.description, '([0-9]+)\s*$'))[1] AS dc_txt
  FROM public.bank_transactions b
  WHERE b.description ILIKE 'HE Egg Sale%'
    AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
)
SELECT count(*)::int AS unlinked_receipts,
       round(sum(u.amount))::int AS receipts_total,
       count(d.id)::int AS dispatches_matched,
       count(*) FILTER (WHERE d.payment_status = 'Received')::int AS dispatch_already_received,
       count(*) FILTER (WHERE COALESCE(d.amount_received,0) > 0)::int AS dispatch_has_money_already,
       round(sum(d.amount))::int AS dispatch_amount_total
FROM unl u
LEFT JOIN public.he_dispatch d ON d.dc_no::text = u.dc_txt;

-- Do any OTHER bank rows already cover these same dispatches? If one does,
-- the unlinked seven are duplicates rather than missing links.
WITH unl AS (
  SELECT (regexp_match(b.description, '([0-9]+)\s*$'))[1] AS dc_txt
  FROM public.bank_transactions b
  WHERE b.description ILIKE 'HE Egg Sale%'
    AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
)
SELECT COALESCE(string_agg(x.dc_no || ': ' || x.n || ' linked receipt(s) Rs ' || x.amt, ' | ' ORDER BY x.dc_no), 'none') AS other_receipts
FROM (
  SELECT d.dc_no::text AS dc_no,
         count(b2.*)::int AS n,
         round(COALESCE(sum(b2.amount),0))::int AS amt
  FROM unl u
  JOIN public.he_dispatch d ON d.dc_no::text = u.dc_txt
  JOIN public.bank_transactions b2 ON b2.he_dispatch_id = d.id
  GROUP BY d.dc_no
) x;
