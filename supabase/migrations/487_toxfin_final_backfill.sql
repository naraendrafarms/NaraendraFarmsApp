-- Final sweep: the 10 rows migration 485 found were byte-identical to
-- migration 484's exact-match string (confirmed via hex dump in 486) —
-- they simply didn't exist yet when 484's UPDATE ran (live production
-- entries recorded in the few minutes between the two runs, unrelated
-- to the original bug). Re-run the same backfill to catch them.
UPDATE public.stock_ledger
SET item_id = 'd05632af-ef77-4d4e-a771-52714111b58f'
WHERE item_id IS NULL AND item_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry');

UPDATE public.feed_production_ingredients
SET item_id = 'd05632af-ef77-4d4e-a771-52714111b58f'
WHERE item_id IS NULL AND ingredient_name IN ('Toxfin 360 Dry', 'Toxfin360 Dry');

SELECT 'stock_ledger' AS tbl, count(*) AS orphan_rows FROM public.stock_ledger
  WHERE item_id IS NULL AND item_name ILIKE '%toxfin%'
UNION ALL
SELECT 'feed_production_ingredients', count(*) FROM public.feed_production_ingredients
  WHERE item_id IS NULL AND ingredient_name ILIKE '%toxfin%';
