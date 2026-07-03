-- Packaging stock tracking: egg boxes/trays entered on HE Dispatch now
-- consume from a real stock balance (purchased via GRN - consumed via
-- dispatch), same pattern as feed ingredients / medicines.
--
-- 1. Add 4 packaging items to the unified items master so they can be
--    purchased via the normal GRN screen.
-- 2. Link stock_ledger rows to their source he_dispatch row (for clean
--    reversal on edit/delete, same pattern as grn_id/med_usage_id).
-- 3. Trigger: on he_dispatch INSERT/UPDATE/DELETE, write/replace/remove
--    'dispatch_out' stock_ledger rows for whichever of the 4 fields are
--    non-zero. UPDATE is handled as delete-then-reinsert (simpler and
--    correct here since a single dispatch can touch up to 4 different
--    items, unlike medicine_usage's 1-row-per-item case).

INSERT INTO public.items (name, short_name, category, unit)
SELECT * FROM (VALUES
  ('Egg Box 20LB', 'Box 20LB', 'Packaging', 'Nos'),
  ('Egg Box 23LB', 'Box 23LB', 'Packaging', 'Nos'),
  ('Egg Tray 20LB', 'Tray 20LB', 'Packaging', 'Nos'),
  ('Egg Tray 23LB', 'Tray 23LB', 'Packaging', 'Nos')
) AS v(name, short_name, category, unit)
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.name = v.name);

ALTER TABLE public.stock_ledger
  ADD COLUMN IF NOT EXISTS he_dispatch_id UUID REFERENCES public.he_dispatch(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sl_he_dispatch ON public.stock_ledger(he_dispatch_id) WHERE he_dispatch_id IS NOT NULL;

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
  -- Always clear old entries for this dispatch first (covers UPDATE/DELETE,
  -- and is a harmless no-op on first INSERT).
  DELETE FROM public.stock_ledger
  WHERE he_dispatch_id = COALESCE(NEW.id, OLD.id) AND txn_type = 'dispatch_out';

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  v_row := NEW;
  SELECT laying_farm_id INTO v_farm_id FROM public.flocks WHERE id = v_row.flock_id;

  SELECT id INTO v_box20_id  FROM public.items WHERE name = 'Egg Box 20LB';
  SELECT id INTO v_box23_id  FROM public.items WHERE name = 'Egg Box 23LB';
  SELECT id INTO v_tray20_id FROM public.items WHERE name = 'Egg Tray 20LB';
  SELECT id INTO v_tray23_id FROM public.items WHERE name = 'Egg Tray 23LB';

  IF COALESCE(v_row.boxes_20lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_box20_id, 'Egg Box 20LB', v_row.boxes_20lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.boxes_23lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_box23_id, 'Egg Box 23LB', v_row.boxes_23lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.extra_trays_20lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_tray20_id, 'Egg Tray 20LB', v_row.extra_trays_20lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  IF COALESCE(v_row.extra_trays_23lb, 0) > 0 THEN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
    VALUES (v_row.dispatch_date, 'dispatch_out', v_tray23_id, 'Egg Tray 23LB', v_row.extra_trays_23lb, 'Nos', v_row.id, v_row.flock_id, v_farm_id, v_row.dc_no::TEXT);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_dispatch_to_stock_ledger error for he_dispatch id=%: %', COALESCE(NEW.id, OLD.id), SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_stock_ledger ON public.he_dispatch;
CREATE TRIGGER trg_dispatch_stock_ledger
  AFTER INSERT OR UPDATE OR DELETE ON public.he_dispatch
  FOR EACH ROW EXECUTE FUNCTION public.fn_dispatch_to_stock_ledger();

-- Verify
SELECT name, category, unit FROM public.items WHERE category = 'Packaging' ORDER BY name;
