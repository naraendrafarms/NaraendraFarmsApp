-- Migration 346: Diagnose blank-name "Dose" row in Inventory (Consumed 64,431)
-- Root cause hypothesis: stock_ledger rows with item_id/item_name blank, all
-- collapsing into one grouped row in InventoryPages.tsx (key = item_id ?? norm(item_name)).

-- A. How many stock_ledger rows have blank item_name / null item_id, by unit, with total qty
SELECT unit, txn_type, item_id IS NULL AS item_id_null, COUNT(*) AS rows, SUM(qty) AS total_qty
FROM public.stock_ledger
WHERE (item_name IS NULL OR TRIM(item_name) = '')
GROUP BY unit, txn_type, item_id IS NULL
ORDER BY total_qty DESC;

-- B. medicine_usage rows whose item_id is null but medicine_id (legacy FK) is set,
--    with the medicine name from medicines_master, summed by medicine
SELECT mm.name AS medicine_name, mu.unit, COUNT(*) AS rows, SUM(mu.quantity) AS total_qty
FROM public.medicine_usage mu
LEFT JOIN public.medicines_master mm ON mm.id = mu.medicine_id
WHERE mu.item_id IS NULL
GROUP BY mm.name, mu.unit
ORDER BY total_qty DESC;

-- C. Does that medicines_master name exist in the unified items table (would explain why item_id never got set)?
SELECT mm.id AS medicine_id, mm.name, mm.is_active,
  (SELECT id FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name))) AS matching_item_id
FROM public.medicines_master mm
WHERE mm.id IN (SELECT DISTINCT medicine_id FROM public.medicine_usage WHERE item_id IS NULL AND medicine_id IS NOT NULL);
