-- Migration 217: ROOT FIX. feed_production_ingredients has qty_used_kg + ingredient_id,
-- but the frontend and stock-ledger trigger insert/use ingredient_name + quantity_kg,
-- which don't exist -> every ingredient insert silently fails (column does not exist).
-- Add the expected columns, keep qty_used_kg synced, drop its NOT NULL, then backfill.

ALTER TABLE public.feed_production_ingredients ADD COLUMN IF NOT EXISTS ingredient_name TEXT;
ALTER TABLE public.feed_production_ingredients ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(12,3);
ALTER TABLE public.feed_production_ingredients ALTER COLUMN qty_used_kg DROP NOT NULL;

-- Keep quantity_kg and qty_used_kg in sync regardless of which one is supplied
CREATE OR REPLACE FUNCTION public.fn_sync_prod_ing_qty() RETURNS trigger AS
$$
BEGIN
  NEW.qty_used_kg := COALESCE(NEW.qty_used_kg, NEW.quantity_kg, 0);
  NEW.quantity_kg := COALESCE(NEW.quantity_kg, NEW.qty_used_kg, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_prod_ing_qty ON public.feed_production_ingredients;
CREATE TRIGGER trg_sync_prod_ing_qty
  BEFORE INSERT OR UPDATE ON public.feed_production_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_prod_ing_qty();

-- Backfill ingredient lines for production logs that have none (fires stock trigger)
INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg)
SELECT l.id,
       fi.ingredient_name,
       ROUND(CASE WHEN COALESCE(fi.kg_per_1000,0) > 0
                  THEN COALESCE(fi.kg_per_1000,0) * COALESCE(l.quantity_kg,0) / 1000.0
                  ELSE COALESCE(fi.percentage,0) / 100.0 * COALESCE(l.quantity_kg,0) END, 3)
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id);

SELECT 'after' AS chk,
  (SELECT COUNT(*) FROM public.feed_production_ingredients) AS ing_rows,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_rows,
  (SELECT COALESCE(SUM(qty),0) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_kg;
