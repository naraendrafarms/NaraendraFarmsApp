-- Migration 160: Verify items table count after backfill
SELECT 'items' AS tbl, COUNT(*) AS rows FROM public.items
UNION ALL
SELECT 'feed_ingredients', COUNT(*) FROM public.feed_ingredients
UNION ALL
SELECT 'medicines_master', COUNT(*) FROM public.medicines_master
UNION ALL
SELECT 'general_items', COUNT(*) FROM public.general_items
UNION ALL
SELECT 'grn_with_item_id', COUNT(*) FROM public.grn WHERE item_id IS NOT NULL
UNION ALL
SELECT 'grn_missing_item_id', COUNT(*) FROM public.grn WHERE item_id IS NULL AND item_name IS NOT NULL;
