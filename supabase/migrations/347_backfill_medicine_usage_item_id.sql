-- Migration 347: Backfill medicine_usage.item_id for rows that lost their item link
-- pre-unification, so their stock_ledger rows currently show as a blank-name
-- "Dose" bucket in Inventory (Prevexxion RN/Marek, NoBills IB 4-91, NoBills IB MA5,
-- Solex M, Layvit Premix, etc).
--
-- Updating medicine_usage.item_id fires the existing trg on medicine_usage
-- (migration 154) which rewrites the matching stock_ledger row's item_id/item_name.

-- Diagnostic: count of affected rows before
SELECT COUNT(*) AS null_item_id_before FROM public.medicine_usage WHERE item_id IS NULL;

UPDATE public.medicine_usage mu
SET item_id = i.id
FROM public.medicines_master mm
JOIN public.items i ON LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name))
WHERE mu.item_id IS NULL
  AND mu.medicine_id = mm.id;

-- Diagnostic: count of affected rows after (should be 0, or only the truly
-- unmatched ones with no medicine_id / no matching item name)
SELECT COUNT(*) AS null_item_id_after FROM public.medicine_usage WHERE item_id IS NULL;

-- Verify the stock_ledger rows got the real name back
SELECT item_name, unit, COUNT(*) AS rows, SUM(qty) AS total_qty
FROM public.stock_ledger
WHERE txn_type = 'medicine_out' AND (item_name IS NULL OR TRIM(item_name) = '')
GROUP BY item_name, unit;
