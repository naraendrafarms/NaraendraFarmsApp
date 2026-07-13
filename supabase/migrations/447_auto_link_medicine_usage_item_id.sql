-- Root cause of "used medicine but Items Master stock didn't move": the app
-- (Daily Entry / Bulk Daily Entry) only ever sets medicine_usage.medicine_id
-- (FK to medicines_master) when recording usage — it never sets item_id (FK
-- to items, the actual Items Master table stock_ledger keys off, per
-- migration 154's trg_med_usage_stock_ledger). Until now item_id was only
-- ever populated by one-off manual backfill migrations (319/346/347) run
-- after the fact — every new entry made since the last backfill (e.g. Flock
-- 22's recent Vitalosin usage) had item_id NULL, so its stock_ledger OUT row
-- also had item_id NULL and never decremented the real Items Master stock.
--
-- Fix: a trigger that derives item_id from medicine_id (matching
-- medicines_master.name to items.name, same logic as migration 347's
-- backfill) on every insert/update, so this can't recur — plus a one-time
-- backfill for anything recorded since 347 ran.

SELECT COUNT(*) AS null_item_id_before FROM public.medicine_usage WHERE item_id IS NULL;

CREATE OR REPLACE FUNCTION public.fn_medicine_usage_set_item_id()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.medicine_id IS NOT NULL THEN
    SELECT i.id INTO NEW.item_id
    FROM public.medicines_master mm
    JOIN public.items i ON LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name))
    WHERE mm.id = NEW.medicine_id
    LIMIT 1;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medicine_usage_set_item_id ON public.medicine_usage;
CREATE TRIGGER trg_medicine_usage_set_item_id
  BEFORE INSERT OR UPDATE ON public.medicine_usage
  FOR EACH ROW EXECUTE FUNCTION public.fn_medicine_usage_set_item_id();

-- Backfill anything recorded since the last one-off fix (347) — this also
-- re-fires the AFTER trigger from migration 154 via the UPDATE, correcting
-- the linked stock_ledger row's item_id/item_name too.
UPDATE public.medicine_usage mu
SET item_id = i.id
FROM public.medicines_master mm
JOIN public.items i ON LOWER(TRIM(i.name)) = LOWER(TRIM(mm.name))
WHERE mu.item_id IS NULL
  AND mu.medicine_id = mm.id;

SELECT COUNT(*) AS null_item_id_after FROM public.medicine_usage WHERE item_id IS NULL;
