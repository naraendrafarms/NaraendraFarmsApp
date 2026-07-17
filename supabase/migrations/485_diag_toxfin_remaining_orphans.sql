-- Migration 484 backfilled item_id for exact-match 'Toxfin 360 Dry' /
-- 'Toxfin360 Dry' spellings but 10 stock_ledger rows remained orphaned —
-- there must be a third spelling/whitespace variant. Surface it exactly.
SELECT item_name, count(*), array_agg(DISTINCT txn_type) AS txn_types
FROM public.stock_ledger
WHERE item_id IS NULL AND item_name ILIKE '%toxfin%'
GROUP BY item_name;
