-- Migration 151: Unified items table
-- Merges feed_ingredients + medicines_master + general_items into one items table.
-- Adds item_id FK to grn, medicine_usage, medicine_purchases, feed_production_ingredients.
-- Old tables kept for now (read-only via backward-compat views).

-- ─── 1. CREATE UNIFIED ITEMS TABLE ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  short_name    TEXT,
  category      TEXT NOT NULL DEFAULT 'Other',
  sub_type      TEXT,
  unit          TEXT NOT NULL DEFAULT 'kg',
  hsn_code      TEXT,
  manufacturer  TEXT,
  protein_pct   NUMERIC(5,2),
  moisture_pct  NUMERIC(5,2),
  reorder_level NUMERIC(12,3) DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.items.category IS
  'Feed Ingredient | Medicine | Vaccine | Supplement | Sanitizer | Injectable | Disinfectant | Pesticide | Packaging | Equipment | Chemical | Spares | Other';

-- ─── 2. MIGRATE FEED INGREDIENTS ─────────────────────────────────────────────

INSERT INTO public.items (
  id, code, name, short_name,
  category, sub_type, unit,
  protein_pct, moisture_pct,
  is_active, created_at
)
SELECT
  id,
  code,
  name,
  short_name,
  'Feed Ingredient' AS category,
  category          AS sub_type,   -- grain/protein/mineral/supplement/additive/other
  COALESCE(unit, 'kg'),
  protein_pct,
  moisture_pct,
  is_active,
  created_at
FROM public.feed_ingredients
ON CONFLICT (id) DO NOTHING;

-- ─── 3. MIGRATE MEDICINES MASTER ─────────────────────────────────────────────

INSERT INTO public.items (
  id, name,
  category, sub_type, unit,
  manufacturer, is_active, created_at
)
SELECT
  id,
  name,
  CASE type
    WHEN 'vaccine'      THEN 'Vaccine'
    WHEN 'supplement'   THEN 'Supplement'
    WHEN 'sanitizer'    THEN 'Sanitizer'
    WHEN 'injectable'   THEN 'Injectable'
    WHEN 'disinfectant' THEN 'Disinfectant'
    WHEN 'pesticide'    THEN 'Pesticide'
    ELSE                     'Medicine'
  END AS category,
  type AS sub_type,
  COALESCE(unit, 'ml'),
  manufacturer,
  is_active,
  created_at
FROM public.medicines_master
ON CONFLICT (id) DO NOTHING;

-- ─── 4. MIGRATE GENERAL ITEMS ────────────────────────────────────────────────

INSERT INTO public.items (
  id, name,
  category, unit, hsn_code,
  is_active, created_at
)
SELECT
  id,
  name,
  CASE LOWER(category)
    WHEN 'packaging'  THEN 'Packaging'
    WHEN 'equipment'  THEN 'Equipment'
    WHEN 'chemical'   THEN 'Chemical'
    WHEN 'spares'     THEN 'Spares'
    WHEN 'feed'       THEN 'Feed Ingredient'
    WHEN 'medicine'   THEN 'Medicine'
    ELSE                   INITCAP(category)
  END AS category,
  COALESCE(unit, 'Nos'),
  hsn_code,
  is_active,
  created_at
FROM public.general_items
ON CONFLICT (id) DO NOTHING;

-- ─── 5. ADD item_id TO GRN ───────────────────────────────────────────────────

ALTER TABLE public.grn
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

-- Backfill: match via existing ingredient_id (feed_ingredients share same UUID in items)
UPDATE public.grn SET item_id = ingredient_id
WHERE ingredient_id IS NOT NULL AND item_id IS NULL;

-- Backfill remaining via case-insensitive name match
UPDATE public.grn g SET item_id = i.id
FROM public.items i
WHERE g.item_id IS NULL
  AND g.item_name IS NOT NULL
  AND LOWER(TRIM(g.item_name)) = LOWER(TRIM(i.name));

-- ─── 6. ADD item_id TO MEDICINE_USAGE ────────────────────────────────────────

ALTER TABLE public.medicine_usage
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

UPDATE public.medicine_usage mu SET item_id = mu.medicine_id
WHERE mu.medicine_id IS NOT NULL AND mu.item_id IS NULL;

-- ─── 7. ADD item_id TO MEDICINE_PURCHASES ────────────────────────────────────

ALTER TABLE public.medicine_purchases
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

UPDATE public.medicine_purchases mp SET item_id = mp.medicine_id
WHERE mp.medicine_id IS NOT NULL AND mp.item_id IS NULL;

-- ─── 8. ADD item_id TO FEED_PRODUCTION_INGREDIENTS ───────────────────────────

ALTER TABLE public.feed_production_ingredients
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

-- Backfill via ingredient_id if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feed_production_ingredients' AND column_name = 'ingredient_id'
  ) THEN
    UPDATE public.feed_production_ingredients fpi
    SET item_id = fpi.ingredient_id
    WHERE fpi.ingredient_id IS NOT NULL AND fpi.item_id IS NULL;
  END IF;
END
$$;

-- Backfill remaining via ingredient_name
UPDATE public.feed_production_ingredients fpi SET item_id = i.id
FROM public.items i
WHERE fpi.item_id IS NULL
  AND fpi.ingredient_name IS NOT NULL
  AND LOWER(TRIM(fpi.ingredient_name)) = LOWER(TRIM(i.name));

-- ─── 9. ADD item_id TO PURCHASE_ORDERS ───────────────────────────────────────

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

-- Backfill via item_name match
UPDATE public.purchase_orders po SET item_id = i.id
FROM public.items i
WHERE po.item_id IS NULL
  AND po.item_name IS NOT NULL
  AND LOWER(TRIM(po.item_name)) = LOWER(TRIM(i.name));

-- ─── 10. DIAGNOSTIC — show unmatched GRN rows ────────────────────────────────

DO $$
DECLARE unmatched INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmatched FROM public.grn WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'GRN rows with item_name but no item_id match: %', unmatched;

  SELECT COUNT(*) INTO unmatched FROM public.feed_production_ingredients WHERE item_id IS NULL AND ingredient_name IS NOT NULL;
  RAISE NOTICE 'feed_production_ingredients rows with no item_id match: %', unmatched;

  SELECT COUNT(*) INTO unmatched FROM public.purchase_orders WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'purchase_orders rows with no item_id match: %', unmatched;
END
$$;

-- ─── 11. UPDATE config_options categories for items ──────────────────────────

INSERT INTO public.config_options (grp, value, label, sort_order, is_active)
VALUES
  ('item_category', 'Feed Ingredient', 'Feed Ingredient', 1, TRUE),
  ('item_category', 'Medicine',        'Medicine',        2, TRUE),
  ('item_category', 'Vaccine',         'Vaccine',         3, TRUE),
  ('item_category', 'Supplement',      'Supplement',      4, TRUE),
  ('item_category', 'Sanitizer',       'Sanitizer',       5, TRUE),
  ('item_category', 'Injectable',      'Injectable',      6, TRUE),
  ('item_category', 'Disinfectant',    'Disinfectant',    7, TRUE),
  ('item_category', 'Pesticide',       'Pesticide',       8, TRUE),
  ('item_category', 'Packaging',       'Packaging',       9, TRUE),
  ('item_category', 'Equipment',       'Equipment',       10, TRUE),
  ('item_category', 'Chemical',        'Chemical',        11, TRUE),
  ('item_category', 'Spares',          'Spares',          12, TRUE),
  ('item_category', 'Other',           'Other',           13, TRUE)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Done: unified items table created and data migrated from feed_ingredients, medicines_master, general_items';
