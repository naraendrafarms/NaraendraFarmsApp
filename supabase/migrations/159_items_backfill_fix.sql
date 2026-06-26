-- Migration 159: Fix items backfill — handles duplicate codes that caused silent failure in 151/157

-- ── 1. Feed Ingredients → items ──────────────────────────────────────────────
-- Nullify code when duplicated within feed_ingredients to avoid UNIQUE violation
INSERT INTO public.items (id, name, code, category, sub_type, unit, protein_pct, moisture_pct, is_active, created_at)
SELECT
  fi.id,
  fi.name,
  CASE WHEN COUNT(*) OVER (PARTITION BY fi.code) = 1 AND fi.code IS NOT NULL
       THEN fi.code ELSE NULL END AS code,
  'Feed Ingredient',
  fi.category,
  COALESCE(fi.unit, 'kg'),
  fi.protein_pct,
  fi.moisture_pct,
  COALESCE(fi.is_active, TRUE),
  COALESCE(fi.created_at, NOW())
FROM public.feed_ingredients fi
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = fi.id);

-- ── 2. Medicines Master → items ───────────────────────────────────────────────
INSERT INTO public.items (id, name, category, sub_type, unit, manufacturer, is_active, created_at)
SELECT
  mm.id,
  mm.name,
  CASE mm.type
    WHEN 'vaccine'      THEN 'Vaccine'
    WHEN 'supplement'   THEN 'Supplement'
    WHEN 'sanitizer'    THEN 'Sanitizer'
    WHEN 'injectable'   THEN 'Injectable'
    WHEN 'disinfectant' THEN 'Disinfectant'
    WHEN 'pesticide'    THEN 'Pesticide'
    ELSE 'Medicine'
  END,
  mm.type,
  COALESCE(mm.unit, 'ml'),
  mm.manufacturer,
  COALESCE(mm.is_active, TRUE),
  COALESCE(mm.created_at, NOW())
FROM public.medicines_master mm
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = mm.id)
  AND NOT EXISTS (SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name)));

-- ── 3. General Items → items ──────────────────────────────────────────────────
INSERT INTO public.items (id, name, category, unit, is_active, created_at)
SELECT
  gi.id,
  gi.name,
  CASE LOWER(COALESCE(gi.category, ''))
    WHEN 'packaging'  THEN 'Packaging'
    WHEN 'equipment'  THEN 'Equipment'
    WHEN 'chemical'   THEN 'Chemical'
    WHEN 'spares'     THEN 'Spares'
    ELSE 'Other'
  END,
  COALESCE(gi.unit, 'Nos'),
  TRUE,
  COALESCE(gi.created_at, NOW())
FROM public.general_items gi
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = gi.id)
  AND NOT EXISTS (SELECT 1 FROM public.items i WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(gi.name)));

-- ── 4. Backfill grn.item_id for still-unmatched rows ─────────────────────────
UPDATE public.grn g SET item_id = g.ingredient_id
WHERE g.ingredient_id IS NOT NULL AND g.item_id IS NULL;

UPDATE public.grn g SET item_id = i.id
FROM public.items i
WHERE g.item_id IS NULL
  AND g.item_name IS NOT NULL
  AND LOWER(TRIM(i.name)) = LOWER(TRIM(g.item_name));

-- ── 5. Diagnostic counts ──────────────────────────────────────────────────────
DO $$
DECLARE
  c_items  INT; c_fi INT; c_mm INT; c_gi INT;
  c_grn_ok INT; c_grn_bad INT;
BEGIN
  SELECT COUNT(*) INTO c_items FROM public.items;
  SELECT COUNT(*) INTO c_fi    FROM public.feed_ingredients;
  SELECT COUNT(*) INTO c_mm    FROM public.medicines_master;
  SELECT COUNT(*) INTO c_gi    FROM public.general_items;
  SELECT COUNT(*) INTO c_grn_ok  FROM public.grn WHERE item_id IS NOT NULL;
  SELECT COUNT(*) INTO c_grn_bad FROM public.grn WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'items=%, feed_ingredients=%, medicines_master=%, general_items=%', c_items, c_fi, c_mm, c_gi;
  RAISE NOTICE 'grn matched=%, grn unmatched=%', c_grn_ok, c_grn_bad;
END;
$$;
