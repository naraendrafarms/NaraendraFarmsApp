-- Extends the alias system (451) to medicines_master itself, so every
-- medicine dropdown (Daily Entry, Bulk Daily Entry, Flock Sales, VHL, Feed
-- GRN) can search by ANY of an item's known names, not just its
-- medicines_master.name. Mirrors the medicine_usage.item_id fix (447).
ALTER TABLE public.medicines_master ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.fn_medicines_master_set_item_id()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.item_id IS NULL THEN
    NEW.item_id := public.fn_resolve_item_id(NEW.name);
  END IF;
  -- Whichever item this medicine ends up linked to, its own name becomes a
  -- permanent alias for that item — so this exact medicine name resolves
  -- correctly everywhere from now on, no manual "link" step needed for the
  -- common case of a name that already matches an alias.
  IF NEW.item_id IS NOT NULL THEN
    PERFORM public.fn_register_item_alias(NEW.item_id, NEW.name, 'medicine');
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medicines_master_set_item_id ON public.medicines_master;
CREATE TRIGGER trg_medicines_master_set_item_id
  BEFORE INSERT OR UPDATE ON public.medicines_master
  FOR EACH ROW EXECUTE FUNCTION public.fn_medicines_master_set_item_id();

-- One-time backfill + diagnostic
SELECT count(*) AS null_before FROM public.medicines_master WHERE item_id IS NULL;

UPDATE public.medicines_master mm
SET item_id = public.fn_resolve_item_id(mm.name)
WHERE mm.item_id IS NULL;

SELECT count(*) AS null_after FROM public.medicines_master WHERE item_id IS NULL;
