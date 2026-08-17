-- Make the feed-mill consumption trigger fail LOUDLY.
--
-- Until now it caught every error and carried on with a warning nobody reads,
-- so a production that could not post its consumption still saved and the
-- ingredients never came off stock. That is how 921 lines and 8,62,210 kg went
-- missing across four months without a single visible symptom.
--
-- From here a failure raises, so the save is refused and the user sees why.
-- The trade is deliberate: a refused save is annoying, silently wrong stock is
-- worse, and only one of the two gets noticed.
--
-- The logic is otherwise exactly as migration 209 left it -- resolve the item
-- by name, write one production_out per ingredient line, update and delete in
-- step with the line.

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

      -- An edit whose ledger row is missing must CREATE it, not quietly do
      -- nothing: that is how an edited batch used to lose its consumption.
      IF NOT FOUND THEN
        INSERT INTO public.stock_ledger(
          txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id)
        VALUES(
          COALESCE(v_prod_date, CURRENT_DATE), 'production_out', v_item_id,
          COALESCE(NEW.ingredient_name,''), COALESCE(NEW.quantity_kg,0), 'kg',
          NEW.production_id, v_farm_id);
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
    WHERE feed_prod_id = OLD.production_id
      AND txn_type = 'production_out'
      AND item_name = OLD.ingredient_name;
  END IF;

  RETURN COALESCE(NEW, OLD);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Stock could not be updated for ingredient "%" on this production (%). The production was NOT saved. Tell the office: %',
    COALESCE(NEW.ingredient_name, OLD.ingredient_name, '?'),
    COALESCE(NEW.production_id, OLD.production_id), SQLERRM;
END;
$$;

SELECT COALESCE(string_agg(tgname, ', '), 'NO TRIGGER') AS triggers_on_ingredients
FROM pg_trigger WHERE tgrelid = 'public.feed_production_ingredients'::regclass AND NOT tgisinternal;

SELECT CASE WHEN prosrc LIKE '%RAISE EXCEPTION%' THEN 'HARDENED — failures now refuse the save'
            ELSE 'STILL SWALLOWING ERRORS' END AS trigger_state
FROM pg_proc WHERE proname = 'fn_feed_prod_to_stock_ledger';
