-- Fix migration 296: it created 4 new packaging items without checking for
-- existing ones first. The app already had "20 LB Corrugated Boxes",
-- "20 LB Pulp Paper Egg Trays", and "23 LB Pulp Paper Egg Trays" — 3 of my
-- 4 new items were exact-duplicates of these. Only "Egg Box 23LB" was
-- genuinely new (no pre-existing 23LB box item exists).
--
-- Fix: delete the 3 duplicate items, repoint fn_dispatch_to_stock_ledger()
-- at the real pre-existing item names, keep "Egg Box 23LB" since it has no
-- equivalent. No he_dispatch rows have been saved against the duplicates
-- yet (trigger just went live), so there's no stock_ledger data to migrate.

DELETE FROM public.items WHERE name IN ('Egg Box 20LB', 'Egg Tray 20LB', 'Egg Tray 23LB');

CREATE OR REPLACE FUNCTION public.fn_dispatch_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE
  v_row      RECORD;
  v_farm_id  UUID;
  v_box20_id UUID;
  v_box23_id UUID;
  v_tray20_id UUID;
  v_tray23_id UUID;
BEGIN
  DELETE FROM public.stock_ledger
  WHERE he_dispatch_id = COALESCE(NEW.id, OLD.id) AND txn_type = 'dispatch_out';

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  v_row := NEW;
  SELECT laying_farm_id INTO v_farm_id FROM public.flocks WHERE id = v_row.flock_id;

  SELECT id INTO v_box20_id  FROM public.items WHERE name = '20 LB Corrugated Boxes';
  SELECT id INTO v_box23_id  FROM public.items WHERE name = 'Egg Box 23LB';
  SELECT id INTO v_tray20_id FROM public.items WHERE name = '20 LB Pulp Paper Egg Trays';
  SELECT id INTO v_tray23_id FROM public.items WHERE name = '23 LB Pulp Paper Egg Trays';

  IF COALESCE(v_row.boxes_20lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_box20_id, '20 LB Corrugated Boxes', v_row.boxes_20lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.boxes_23lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_box23_id, 'Egg Box 23LB', v_row.boxes_23lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.extra_trays_20lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_tray20_id, '20 LB Pulp Paper Egg Trays', v_row.extra_trays_20lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.extra_trays_23lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_tray23_id, '23 LB Pulp Paper Egg Trays', v_row.extra_trays_23lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_dispatch_to_stock_ledger error for he_dispatch id=%: %', COALESCE(NEW.id, OLD.id), SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Verify: no duplicates remain, exactly 6 packaging items now
-- (4 pre-existing + Egg Box 23LB + Twine)
SELECT name, category, unit FROM public.items WHERE category = 'Packaging' ORDER BY name;
