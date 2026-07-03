-- VHL site "Bodjanampet - 2 (VHL)" (farm id a7883f96-fc7b-4e9b-80fd-25d45e9b1799)
-- supplies its own boxes/trays — dispatches from flocks laying at this site
-- must NOT consume the farm's own packaging stock. Confirmed (317): only
-- Flock 21 is currently at this site, and it has no existing dispatch_out
-- rows to reverse — this is purely a forward-looking fix based on the
-- flock's laying_farm_id, so it automatically covers any future flock
-- placed at this VHL site too, not just Flock 21 by number.

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

  -- VHL site supplies its own packaging — never consume farm stock for it.
  IF v_farm_id = 'a7883f96-fc7b-4e9b-80fd-25d45e9b1799' THEN
    RETURN NEW;
  END IF;

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

SELECT 'ok' AS chk;
