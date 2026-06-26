-- Migration 173: Fix stock_ledger rows that have blank item_name
-- Root cause: old GRN rows used ingredient_id FK (to feed_ingredients) not item_name text.
-- Migration 172 backfill used COALESCE(g.item_name,'') which left item_name='' for those rows.
-- Fix: Update those rows via grn.ingredient_id -> feed_ingredients.name

-- Step 1: Fill in item_name for GRN-sourced ledger rows where item_name is blank
UPDATE public.stock_ledger sl
SET
  item_name = fi.name,
  item_id   = COALESCE(sl.item_id,
                (SELECT i.id FROM public.items i
                 WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(fi.name))
                 LIMIT 1))
FROM public.grn g
JOIN public.feed_ingredients fi ON fi.id = g.ingredient_id
WHERE sl.grn_id = g.id
  AND sl.txn_type = 'grn_in'
  AND (sl.item_name IS NULL OR TRIM(sl.item_name) = '')
  AND fi.name IS NOT NULL;

-- Step 2: Also fix GRN rows in stock_ledger where item_name is blank but grn has item_id
-- (item_name might be '' but item_id links to items table)
UPDATE public.stock_ledger sl
SET item_name = i.name
FROM public.items i
WHERE sl.item_id = i.id
  AND sl.txn_type = 'grn_in'
  AND (sl.item_name IS NULL OR TRIM(sl.item_name) = '');

-- Step 3: Remove any remaining zero-qty grn_in rows with blank names (unfixable ghosts)
DELETE FROM public.stock_ledger
WHERE txn_type = 'grn_in'
  AND (item_name IS NULL OR TRIM(item_name) = '')
  AND qty = 0;

-- Step 4: Backfill any GRN rows still missing from stock_ledger (where ingredient_id is set)
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
  grn_id, farm_id, reference_no, remarks)
SELECT
  COALESCE(g.grn_date, g.created_at::DATE, CURRENT_DATE),
  'grn_in',
  COALESCE(g.item_id,
    (SELECT i.id FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(fi.name)) LIMIT 1)),
  COALESCE(g.item_name, fi.name, ''),
  COALESCE(g.qty, 0),
  COALESCE(g.unit, fi.unit),
  g.price_per_unit,
  COALESCE(g.total_amount, (COALESCE(g.qty,0) * COALESCE(g.price_per_unit,0))),
  g.id,
  g.farm_id,
  g.grn_no,
  g.remarks
FROM public.grn g
LEFT JOIN public.feed_ingredients fi ON fi.id = g.ingredient_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.grn_id = g.id AND sl.txn_type = 'grn_in'
)
AND COALESCE(g.qty, 0) > 0
AND COALESCE(g.item_name, fi.name, '') != '';

-- Verify
SELECT txn_type, COUNT(*) AS rows, COUNT(NULLIF(TRIM(item_name),'')) AS named_rows
FROM public.stock_ledger
GROUP BY txn_type
ORDER BY txn_type;
