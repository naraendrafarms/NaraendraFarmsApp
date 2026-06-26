-- Add ingredient_id FK to feed_production_ingredients so raw-material stock
-- is properly decremented when feed is produced.
ALTER TABLE public.feed_production_ingredients
  ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES public.feed_ingredients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feed_prod_ing_id ON public.feed_production_ingredients(ingredient_id);

-- Backfill ingredient_id by matching ingredient_name → feed_ingredients.name
UPDATE public.feed_production_ingredients fpi
SET ingredient_id = fi.id
FROM public.feed_ingredients fi
WHERE lower(trim(fi.name)) = lower(trim(fpi.ingredient_name))
  AND fpi.ingredient_id IS NULL;

-- Also try matching by ingredient code (some entries use code as name)
UPDATE public.feed_production_ingredients fpi
SET ingredient_id = fi.id
FROM public.feed_ingredients fi
WHERE fi.code IS NOT NULL
  AND lower(trim(fi.code)) = lower(trim(fpi.ingredient_name))
  AND fpi.ingredient_id IS NULL;

-- Confirm results
SELECT
  COUNT(*) FILTER (WHERE ingredient_id IS NOT NULL) AS linked,
  COUNT(*) FILTER (WHERE ingredient_id IS NULL)     AS unlinked
FROM public.feed_production_ingredients;
