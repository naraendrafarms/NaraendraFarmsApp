-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner has used the new Unlink & reverse, then settled the receipt
-- against DC 4594. Check it landed properly and that nothing else moved.
--
-- Expected: 4639 back to Pending with 0 received; 4594 Received with
-- 11,69,905; the bank row pointing at 4594; and the TOTAL received across all
-- dispatches unchanged at 13,96,65,924, because the same money simply moved
-- from the wrong invoice to the right one.

-- 1. The two dispatches at the centre of it
SELECT d.dc_no::text AS dc_no,
       COALESCE(d.invoice_no,'-') AS invoice_no,
       round(d.amount)::int AS amount,
       round(COALESCE(d.tds_amount,0))::int AS tds,
       round(d.amount - COALESCE(d.tds_amount,0))::int AS net,
       round(COALESCE(d.amount_received,0))::int AS received,
       COALESCE(d.payment_status,'(never set)') AS status,
       (SELECT count(*)::int FROM public.bank_transactions b WHERE b.he_dispatch_id = d.id) AS bank_rows_linked
FROM public.he_dispatch d
WHERE d.dc_no::text IN ('4639','4594')
ORDER BY d.dc_no;

-- 2. The receipt itself - where does it point now
SELECT b.txn_date::text AS txn_date,
       round(b.amount)::int AS amount,
       b.description,
       COALESCE(d.dc_no::text,'(unlinked)') AS now_linked_to_dc,
       COALESCE(d.invoice_no,'-') AS invoice_no,
       round(COALESCE(b.settled_amount,0))::int AS settled_amount,
       (SELECT count(*)::int FROM public.bank_txn_settlements s WHERE s.bank_txn_id = b.id) AS settlement_rows
FROM public.bank_transactions b
LEFT JOIN public.he_dispatch d ON d.id = b.he_dispatch_id
WHERE b.id = 'd884839f-c117-473f-8969-3eebd07e9bed';

-- 3. Nothing lost overall: the same money, against a different invoice.
SELECT count(*)::int AS dispatches,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received_count,
       round(sum(COALESCE(amount_received,0)))::int AS received_total
FROM public.he_dispatch;

-- 4. The other 6 from that batch must still match their invoice net of TDS
WITH b7 AS (SELECT bk.id, bk.amount FROM public.bank_transactions_backup_1325 bk)
SELECT count(*)::int AS of_the_seven,
       count(*) FILTER (WHERE round(d.amount - COALESCE(d.tds_amount,0)) = round(b.amount))::int AS net_matches,
       count(*) FILTER (WHERE d.id IS NOT NULL
                          AND round(d.amount - COALESCE(d.tds_amount,0)) <> round(b.amount))::int AS still_wrong,
       count(*) FILTER (WHERE d.id IS NULL)::int AS unlinked
FROM b7 b
LEFT JOIN public.bank_transactions cur ON cur.id = b.id
LEFT JOIN public.he_dispatch d ON d.id = cur.he_dispatch_id;

-- 5. No dispatch may carry two bank receipts, and no orphan settlement rows
SELECT (SELECT count(*)::int FROM (
          SELECT he_dispatch_id FROM public.bank_transactions
          WHERE he_dispatch_id IS NOT NULL GROUP BY he_dispatch_id HAVING count(*) > 1) x
       ) AS dispatches_with_two_receipts,
       (SELECT count(*)::int FROM public.bank_txn_settlements s
        WHERE NOT EXISTS (SELECT 1 FROM public.bank_transactions b WHERE b.id = s.bank_txn_id)
       ) AS orphan_settlement_rows,
       (SELECT count(*)::int FROM public.bank_txn_settlements) AS settlement_rows_total;
