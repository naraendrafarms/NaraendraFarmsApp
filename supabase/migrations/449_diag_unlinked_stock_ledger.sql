-- Diagnose the blank-name "kg" bucket showing 1,80,517 OUT in Inventory —
-- stock_ledger rows with item_id IS NULL group together with no name/code.
SELECT count(*) AS unlinked_rows, sum(qty) AS total_qty
FROM public.stock_ledger
WHERE item_id IS NULL;

SELECT txn_type, count(*) AS rows, sum(qty) AS total_qty
FROM public.stock_ledger
WHERE item_id IS NULL
GROUP BY txn_type;

-- Which medicines (by name) are behind the still-unlinked medicine_usage rows —
-- these are medicines with NO matching name in Items Master at all, so the
-- name-match backfill (447) had nothing to link them to.
SELECT mm.name AS medicine_name, count(*) AS usage_rows, sum(mu.quantity) AS total_qty
FROM public.medicine_usage mu
JOIN public.medicines_master mm ON mm.id = mu.medicine_id
WHERE mu.item_id IS NULL
GROUP BY mm.name
ORDER BY total_qty DESC;
