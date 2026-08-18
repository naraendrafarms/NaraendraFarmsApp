-- Migration 718: read-only. 717 printed only 5 of its 6 answers and cut one
-- ledger group short. Ask the rest: every CEVAC IBIRD ledger row, whether the
-- usage entries carry the Items Master link, and the balance as it stands.

SELECT 'ledger_detail' AS chk, sl.txn_date,
       COALESCE(NULLIF(btrim(sl.item_name), ''), '(blank)') AS item_name,
       sl.txn_type, sl.qty, sl.unit, sl.unit_price,
       (sl.item_id IS NULL) AS unlinked, (sl.med_usage_id IS NOT NULL) AS from_usage
FROM public.stock_ledger sl
WHERE sl.item_id = 'ff35625a-cce7-4a0c-b27a-bb3d1a3295dd'
   OR sl.med_usage_id IN (SELECT id FROM public.medicine_usage
                          WHERE medicine_id = '2c2ac670-88aa-4ec1-b359-2924d9e8529e')
ORDER BY sl.txn_date;

SELECT 'usage_links' AS chk, mu.usage_date, mu.quantity, mu.item_id::text AS item_id,
       (mu.item_id IS NULL) AS missing_item_link
FROM public.medicine_usage mu
WHERE mu.medicine_id = '2c2ac670-88aa-4ec1-b359-2924d9e8529e'
ORDER BY mu.usage_date;

SELECT 'balance_now' AS chk,
       round(SUM(CASE WHEN sl.txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                      THEN -sl.qty ELSE sl.qty END)::numeric, 2) AS balance_doses
FROM public.stock_ledger sl
WHERE sl.item_id = 'ff35625a-cce7-4a0c-b27a-bb3d1a3295dd';
