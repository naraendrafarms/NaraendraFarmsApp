-- Root cause (confirmed via migration 483's diagnostic): Items Master has
-- one row for this item ("Toxfin360 Dry", no space, id
-- d05632af-ef77-4d4e-a771-52714111b58f), but 46 stock_ledger rows and 30
-- feed_production_ingredients rows recorded it with item_id = NULL under
-- TWO different spellings ("Toxfin 360 Dry" with a space, and
-- "Toxfin360 Dry" without) — Inventory's item_id-else-name fallback key
-- forks these into a second "phantom" row since neither spelling was
-- ever linked. A prior Items Master merge fixed the `items` table (which
-- is why it now shows once there) but had no step for NULL-item_id rows,
-- so it never touched these.
UPDATE public.stock_ledger
SET item_id = 'd05632af-ef77-4d4e-a771-52714111b58f'
WHERE item_id IS NULL AND item_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry');

UPDATE public.feed_production_ingredients
SET item_id = 'd05632af-ef77-4d4e-a771-52714111b58f'
WHERE item_id IS NULL AND ingredient_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry');

-- Register the spaced variant as a known alias too, so search/pickers find
-- the item under either spelling going forward.
INSERT INTO public.item_aliases (item_id, alias, source)
SELECT 'd05632af-ef77-4d4e-a771-52714111b58f', 'Toxfin 360 Dry', 'dedup'
WHERE NOT EXISTS (
  SELECT 1 FROM public.item_aliases WHERE item_id = 'd05632af-ef77-4d4e-a771-52714111b58f' AND alias = 'Toxfin 360 Dry'
);

-- Diagnostic: confirm no orphaned rows remain for this item under either spelling.
SELECT 'stock_ledger' AS tbl, count(*) AS orphan_rows FROM public.stock_ledger
  WHERE item_id IS NULL AND item_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry')
UNION ALL
SELECT 'feed_production_ingredients', count(*) FROM public.feed_production_ingredients
  WHERE item_id IS NULL AND ingredient_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry');
