-- Migration 187's fn_sync_item_to_medicine only ever INSERTed a new
-- medicines_master row for a medicine-type item, guarded by "not exists a
-- row with this exact name" — so editing an EXISTING item (rename, change
-- category, change unit/manufacturer) never updated the already-linked
-- medicines_master row. Worse: renaming an item would pass the "not exists
-- with NEW name" check and silently INSERT A DUPLICATE row under the new
-- name instead of updating the original, leaving two medicines_master rows
-- for what's really one item.
--
-- Fixed to: find the linked medicines_master row via item_id first (the
-- reliable link, migration 453), falling back to a name match on the OLD
-- name (pre-rename) for older rows never linked by item_id. If found,
-- UPDATE it in place. Only insert a new row when genuinely nothing links
-- to this item yet.
CREATE OR REPLACE FUNCTION public.fn_sync_item_to_medicine()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE
  v_type TEXT;
  v_existing_id UUID;
BEGIN
  IF NEW.category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')
     AND COALESCE(NEW.is_active, TRUE) = TRUE THEN
    v_type := CASE LOWER(NEW.category)
      WHEN 'vaccine' THEN 'vaccine' WHEN 'injectable' THEN 'injectable'
      WHEN 'supplement' THEN 'supplement' WHEN 'sanitizer' THEN 'sanitizer'
      WHEN 'disinfectant' THEN 'disinfectant' WHEN 'pesticide' THEN 'pesticide'
      ELSE 'medicine' END;

    -- Prefer the reliable item_id link; fall back to matching the OLD name
    -- (covers rows created before medicines_master.item_id existed, and the
    -- rename case itself where the old name is what's still on file).
    SELECT id INTO v_existing_id FROM public.medicines_master WHERE item_id = NEW.id LIMIT 1;
    IF v_existing_id IS NULL AND TG_OP = 'UPDATE' AND OLD.name IS NOT NULL THEN
      SELECT id INTO v_existing_id FROM public.medicines_master
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(OLD.name)) LIMIT 1;
    END IF;
    IF v_existing_id IS NULL THEN
      SELECT id INTO v_existing_id FROM public.medicines_master
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) LIMIT 1;
    END IF;

    IF v_existing_id IS NOT NULL THEN
      UPDATE public.medicines_master
      SET name = NEW.name, type = v_type, unit = COALESCE(NEW.unit, unit),
          manufacturer = NEW.manufacturer, item_id = NEW.id
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.medicines_master (name, type, unit, manufacturer, is_active, item_id)
      VALUES (NEW.name, v_type, COALESCE(NEW.unit, 'Nos'), NEW.manufacturer, TRUE, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Trigger definition itself is unchanged (already AFTER INSERT OR UPDATE),
-- just re-asserting it points at the updated function body.
DROP TRIGGER IF EXISTS trg_sync_item_medicine ON public.items;
CREATE TRIGGER trg_sync_item_medicine
  AFTER INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_item_to_medicine();

SELECT 'sentinel' AS marker, 1 AS n;
