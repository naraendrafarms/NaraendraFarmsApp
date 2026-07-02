-- Fixes 3 confirmed bugs found while investigating why SPERMED's production-cost
-- rate wasn't using the GRN price:
--
-- 1) grn.category drift: three different GRN-entry screens wrote different
--    strings for the same "feed ingredient purchase" concept — 'Feed'
--    (FeedPages.tsx, PurchaseEntry.tsx, ImportPages.tsx) vs 'Feed Ingredient'
--    (GRNPage.tsx, the item master's own category). Code has been fixed to use
--    'Feed Ingredient' everywhere; this backfills existing rows so old
--    purchases are visible to rate lookups too. Only touches rows that are
--    unambiguously feed purchases (ingredient_id set, or category was blank/
--    'Feed' with a resolvable ingredient_id).
-- 2) feed_ingredients duplicate master row: "Spermed" and "SPERMED" both
--    exist. Repoint every FK reference from the older/lower-quality row
--    ("Spermed", no code) onto the row that has a proper code ("SPERMED"),
--    then delete the duplicate.
-- 3) feed_production_ingredients rows with ingredient_id IS NULL: re-resolve
--    by case/whitespace-insensitive name match now that (2) is fixed.

-- (1) Backfill category drift on grn
UPDATE public.grn
SET category = 'Feed Ingredient'
WHERE category IN ('Feed') OR (category IS NULL AND ingredient_id IS NOT NULL);

-- (2) Merge duplicate SPERMED master row.
--     Survivor: a936db3a-1597-4b4b-a162-cf7a218a9ae9 (name "SPERMED", code "SPERMED")
--     Duplicate: 33011bae-f273-426f-a9a5-3652cbfd26df (name "Spermed", no code)
UPDATE public.feed_production_ingredients
SET ingredient_id = 'a936db3a-1597-4b4b-a162-cf7a218a9ae9'
WHERE ingredient_id = '33011bae-f273-426f-a9a5-3652cbfd26df';

UPDATE public.grn
SET ingredient_id = 'a936db3a-1597-4b4b-a162-cf7a218a9ae9'
WHERE ingredient_id = '33011bae-f273-426f-a9a5-3652cbfd26df';

UPDATE public.feed_formula_ingredients
SET ingredient_id = 'a936db3a-1597-4b4b-a162-cf7a218a9ae9'
WHERE ingredient_id = '33011bae-f273-426f-a9a5-3652cbfd26df';

UPDATE public.stock_ledger
SET ingredient_id = 'a936db3a-1597-4b4b-a162-cf7a218a9ae9'
WHERE ingredient_id = '33011bae-f273-426f-a9a5-3652cbfd26df';

DELETE FROM public.feed_ingredients WHERE id = '33011bae-f273-426f-a9a5-3652cbfd26df';

-- (3) Re-resolve unresolved ingredient_id links app-wide by name match
UPDATE public.feed_production_ingredients fpi
SET ingredient_id = fi.id
FROM public.feed_ingredients fi
WHERE fpi.ingredient_id IS NULL
  AND lower(trim(fi.name)) = lower(trim(fpi.ingredient_name));

-- Verify
SELECT 'grn_category_counts' AS chk, category, count(*) FROM public.grn GROUP BY category ORDER BY 3 DESC;
SELECT 'spermed_master_rows' AS chk, count(*) FROM public.feed_ingredients WHERE name ILIKE '%sperm%';
SELECT 'still_unresolved_fpi' AS chk, count(*) FROM public.feed_production_ingredients WHERE ingredient_id IS NULL;
