-- Migration 157: Verify and re-backfill items table from legacy tables
-- Runs safely: ON CONFLICT (name) DO NOTHING avoids duplicates

-- ── 1. From feed_ingredients ──────────────────────────────────────────────────
INSERT INTO public.items (id, name, code, category, sub_type, unit, is_active, created_at)
SELECT
  fi.id,
  fi.name,
  fi.code,
  'Feed Ingredient',
  fi.sub_type,
  fi.unit,
  COALESCE(fi.is_active, TRUE),
  COALESCE(fi.created_at, NOW())
FROM public.feed_ingredients fi
WHERE NOT EXISTS (
  SELECT 1 FROM public.items i WHERE i.id = fi.id
)
ON CONFLICT (id) DO NOTHING;

-- Also match by name for any that were inserted with different UUIDs
INSERT INTO public.items (name, code, category, sub_type, unit, is_active)
SELECT
  fi.name,
  fi.code,
  'Feed Ingredient',
  fi.sub_type,
  fi.unit,
  COALESCE(fi.is_active, TRUE)
FROM public.feed_ingredients fi
WHERE NOT EXISTS (
  SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(fi.name))
)
ON CONFLICT DO NOTHING;

-- ── 2. From medicines_master ──────────────────────────────────────────────────
INSERT INTO public.items (name, category, sub_type, manufacturer, unit, is_active)
SELECT
  mm.name,
  CASE mm.type
    WHEN 'vaccine'      THEN 'Vaccine'
    WHEN 'injectable'   THEN 'Injectable'
    WHEN 'supplement'   THEN 'Supplement'
    WHEN 'sanitizer'    THEN 'Sanitizer'
    WHEN 'disinfectant' THEN 'Disinfectant'
    WHEN 'pesticide'    THEN 'Pesticide'
    ELSE 'Medicine'
  END,
  mm.form,
  mm.manufacturer,
  COALESCE(mm.unit, 'Nos'),
  TRUE
FROM public.medicines_master mm
WHERE NOT EXISTS (
  SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name))
)
ON CONFLICT DO NOTHING;

-- ── 3. From general_items ─────────────────────────────────────────────────────
INSERT INTO public.items (name, category, unit, is_active)
SELECT
  gi.name,
  CASE COALESCE(gi.category, '')
    WHEN 'Packaging'  THEN 'Packaging'
    WHEN 'Equipment'  THEN 'Equipment'
    WHEN 'Spares'     THEN 'Spares'
    WHEN 'Chemical'   THEN 'Chemical'
    ELSE 'Other'
  END,
  COALESCE(gi.unit, 'Nos'),
  TRUE
FROM public.general_items gi
WHERE NOT EXISTS (
  SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(gi.name))
)
ON CONFLICT DO NOTHING;

-- ── 4. From GRN (any item_name that didn't make it in) ───────────────────────
INSERT INTO public.items (name, category, unit, is_active)
SELECT DISTINCT
  g.item_name,
  COALESCE(g.category, 'Other'),
  COALESCE(g.unit, 'Nos'),
  TRUE
FROM public.grn g
WHERE g.item_name IS NOT NULL
  AND g.item_name <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(g.item_name))
  )
ON CONFLICT DO NOTHING;

-- ── 5. Update item_id on grn rows that are still NULL ─────────────────────────
UPDATE public.grn g SET item_id = i.id
FROM public.items i
WHERE g.item_id IS NULL
  AND g.item_name IS NOT NULL
  AND LOWER(TRIM(i.name)) = LOWER(TRIM(g.item_name));

UPDATE public.grn g SET item_id = i.id
FROM public.items i
WHERE g.item_id IS NULL
  AND g.ingredient_id = i.id;

-- ── 6. Diagnostic counts ───────────────────────────────────────────────────────
DO $$
DECLARE
  c_items   INT;
  c_fi      INT;
  c_mm      INT;
  c_gi      INT;
  c_grn_ok  INT;
  c_grn_bad INT;
BEGIN
  SELECT COUNT(*) INTO c_items  FROM public.items;
  SELECT COUNT(*) INTO c_fi     FROM public.feed_ingredients;
  SELECT COUNT(*) INTO c_mm     FROM public.medicines_master;
  SELECT COUNT(*) INTO c_gi     FROM public.general_items;
  SELECT COUNT(*) INTO c_grn_ok  FROM public.grn WHERE item_id IS NOT NULL;
  SELECT COUNT(*) INTO c_grn_bad FROM public.grn WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'items=%, feed_ingredients=%, medicines_master=%, general_items=%', c_items, c_fi, c_mm, c_gi;
  RAISE NOTICE 'grn with item_id=%, grn missing item_id=%', c_grn_ok, c_grn_bad;
END;
$$;
