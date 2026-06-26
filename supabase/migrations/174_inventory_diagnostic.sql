-- Migration 174: Inventory diagnostic + fix remaining issues

-- ── Diagnostic 1: stock_ledger state ─────────────────────────────────────────
SELECT 'stock_ledger by txn_type' AS check_name,
  txn_type,
  COUNT(*) AS rows,
  COUNT(item_id) AS with_item_id,
  COUNT(NULLIF(TRIM(COALESCE(item_name,'')), '')) AS with_item_name,
  SUM(qty) AS total_qty
FROM public.stock_ledger
GROUP BY txn_type
ORDER BY txn_type;

-- ── Diagnostic 2: GRN state ───────────────────────────────────────────────────
SELECT 'grn state' AS check_name,
  COUNT(*) AS total_grn,
  COUNT(item_id) AS grn_with_item_id,
  COUNT(ingredient_id) AS grn_with_ingredient_id,
  COUNT(NULLIF(TRIM(COALESCE(item_name,'')), '')) AS grn_with_item_name,
  COUNT(*) FILTER (WHERE qty > 0) AS grn_with_qty
FROM public.grn;

-- ── Diagnostic 3: items table ─────────────────────────────────────────────────
SELECT 'items table' AS check_name, COUNT(*) AS total_items,
  COUNT(*) FILTER (WHERE is_active) AS active_items
FROM public.items;

-- ── Diagnostic 4: feed_stock_adjustments ─────────────────────────────────────
SELECT 'adjustments' AS check_name, COUNT(*) AS total_adjustments
FROM public.feed_stock_adjustments;

-- ── Fix: ensure ALL grn rows in stock_ledger have their item_id set ───────────
-- (item_id may still be null if grn.item_id was null during 172 backfill
--  but migration 157 set grn.item_id afterwards)
UPDATE public.stock_ledger sl
SET item_id = g.item_id,
    item_name = COALESCE(NULLIF(TRIM(sl.item_name), ''),
                  (SELECT i.name FROM public.items i WHERE i.id = g.item_id LIMIT 1),
                  sl.item_name)
FROM public.grn g
WHERE sl.grn_id = g.id
  AND sl.txn_type = 'grn_in'
  AND sl.item_id IS NULL
  AND g.item_id IS NOT NULL;

-- ── Fix: set item_name from items table where item_id is set but name is blank ──
UPDATE public.stock_ledger sl
SET item_name = i.name
FROM public.items i
WHERE sl.item_id = i.id
  AND (sl.item_name IS NULL OR TRIM(sl.item_name) = '');

-- ── Fix: backfill grn rows STILL missing from stock_ledger ────────────────────
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
  grn_id, farm_id, reference_no, remarks)
SELECT
  COALESCE(g.grn_date, g.created_at::DATE, CURRENT_DATE),
  'grn_in',
  COALESCE(g.item_id, i2.id),
  COALESCE(NULLIF(TRIM(g.item_name),''), i2.name, fi.name, ''),
  COALESCE(g.qty, 0),
  COALESCE(g.unit, 'kg'),
  g.price_per_unit,
  COALESCE(g.total_amount, (COALESCE(g.qty,0) * COALESCE(g.price_per_unit,0))),
  g.id, g.farm_id, g.grn_no, g.remarks
FROM public.grn g
LEFT JOIN public.feed_ingredients fi ON fi.id = g.ingredient_id
LEFT JOIN public.items i2 ON i2.id = COALESCE(g.item_id, g.ingredient_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.grn_id = g.id AND sl.txn_type = 'grn_in'
)
AND COALESCE(g.qty, 0) > 0;

-- ── Final verify ─────────────────────────────────────────────────────────────
SELECT 'FINAL stock_ledger' AS check_name,
  txn_type,
  COUNT(*) AS rows,
  COUNT(item_id) AS with_item_id,
  COUNT(NULLIF(TRIM(COALESCE(item_name,'')), '')) AS named_rows
FROM public.stock_ledger
GROUP BY txn_type
ORDER BY txn_type;
