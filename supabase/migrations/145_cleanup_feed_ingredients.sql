-- Fix GRNs that are linked to feed_ingredients records that are actually medicines/vaccines.
-- These were entered with category='Feed' but the ingredient is in medicines_master.
-- Move them to the correct category and link to medicines_master.
UPDATE public.grn g
SET
  category    = CASE WHEN lower(mm.type) LIKE '%vaccine%' THEN 'Vaccine' ELSE 'Medicine' END,
  medicine_id = mm.id,
  ingredient_id = NULL
FROM public.feed_ingredients fi
JOIN public.medicines_master mm ON lower(trim(mm.name)) = lower(trim(fi.name))
WHERE g.ingredient_id = fi.id
  AND g.category = 'Feed';

-- Deactivate feed_ingredients records that exist in medicines_master (duplicate / wrong table).
-- After the GRN fix above, these have no more Feed-category GRN stock.
UPDATE public.feed_ingredients fi
SET is_active = false
WHERE EXISTS (
  SELECT 1 FROM public.medicines_master mm
  WHERE lower(trim(mm.name)) = lower(trim(fi.name))
);

-- Deactivate auto-added items (null code, no feed category) that have no GRN stock.
-- These were created by PO receipts for medicines/spares/services — they do not belong here.
UPDATE public.feed_ingredients fi
SET is_active = false
WHERE fi.code IS NULL
  AND (fi.category IS NULL OR fi.category = '')
  AND NOT EXISTS (
    SELECT 1 FROM public.grn g WHERE g.ingredient_id = fi.id AND g.qty > 0
  );
