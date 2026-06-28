-- Migration 209: Fix feed-production consumption (Feed Mill stock usage showing 0).
-- ROOT CAUSE: trigger fn_feed_prod_to_stock_ledger referenced NEW.item_id, but
-- feed_production_ingredients has no item_id column (it's ingredient_id, migration 146).
-- The trigger's EXCEPTION handler swallowed the error, so production_out was NEVER
-- written. Fix: use NEW.ingredient_name and resolve item_id from items by name.
-- Then backfill ingredient lines for production logs that were saved with 0 items.

-- 1. Corrected trigger function
CREATE OR REPLACE FUNCTION public.fn_feed_prod_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE
  v_prod_date DATE;
  v_farm_id   UUID;
  v_item_id   UUID;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT production_date, farm_id INTO v_prod_date, v_farm_id
      FROM public.feed_production_log WHERE id = NEW.production_id;
    SELECT id INTO v_item_id FROM public.items
      WHERE lower(name) = lower(COALESCE(NEW.ingredient_name,'')) LIMIT 1;

    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.stock_ledger(
        txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id)
      VALUES(
        COALESCE(v_prod_date, CURRENT_DATE), 'production_out', v_item_id,
        COALESCE(NEW.ingredient_name,''), COALESCE(NEW.quantity_kg,0), 'kg',
        NEW.production_id, v_farm_id);
    ELSE
      UPDATE public.stock_ledger SET
        txn_date  = COALESCE(v_prod_date, CURRENT_DATE),
        item_id   = v_item_id,
        item_name = COALESCE(NEW.ingredient_name,''),
        qty       = COALESCE(NEW.quantity_kg,0),
        farm_id   = v_farm_id
      WHERE feed_prod_id = NEW.production_id
        AND txn_type = 'production_out'
        AND item_name = OLD.ingredient_name;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
    WHERE feed_prod_id = OLD.production_id
      AND txn_type = 'production_out'
      AND item_name = OLD.ingredient_name;
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_feed_prod_to_stock_ledger error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Backfill ingredient lines for production logs that have NONE, from their formula
--    (percentage x batch kg). Inserting fires the corrected trigger -> writes
--    production_out to stock_ledger, so consumption appears.
INSERT INTO public.feed_production_ingredients (production_id, ingredient_name, quantity_kg, ingredient_id)
SELECT l.id,
       fi.ingredient_name,
       ROUND((COALESCE(fi.percentage,0) / 100.0) * COALESCE(l.quantity_kg,0), 3),
       (SELECT fe.id FROM public.feed_ingredients fe
         WHERE lower(fe.name) = lower(fi.ingredient_name) LIMIT 1)
FROM public.feed_production_log l
JOIN public.feed_formula_ingredients fi ON fi.formula_id = l.formula_id
WHERE l.formula_id IS NOT NULL
  AND COALESCE(fi.percentage,0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id);

-- 3. Verify: ingredient lines per production log + production_out rows now present
SELECT 'A_ings_per_log' AS chk, l.id, l.quantity_kg,
  (SELECT COUNT(*) FROM public.feed_production_ingredients pi WHERE pi.production_id = l.id) AS ing_lines
FROM public.feed_production_log l ORDER BY l.production_date DESC;

SELECT 'B_stock_out' AS chk, COUNT(*) AS production_out_rows, COALESCE(SUM(qty),0) AS total_kg_out
FROM public.stock_ledger WHERE txn_type = 'production_out';
