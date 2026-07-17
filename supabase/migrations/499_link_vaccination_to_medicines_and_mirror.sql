-- Links Vaccination Schedule and Vaccination Records to Medicines Master
-- (which is already linked to Items Master via item_id) so vaccine names
-- stop being disconnected free text, and auto-mirrors a vaccine-type
-- medicine_usage entry into vaccination_records so a vaccination only
-- needs to be entered once (in Medicine & Vaccine), not twice.

ALTER TABLE public.vaccination_schedule
  ADD COLUMN IF NOT EXISTS medicine_id UUID REFERENCES public.medicines_master(id) ON DELETE SET NULL;

ALTER TABLE public.vaccination_records
  ADD COLUMN IF NOT EXISTS medicine_id UUID REFERENCES public.medicines_master(id) ON DELETE SET NULL;

-- Marks a vaccination_records row as auto-created from a medicine_usage
-- entry (as opposed to a manually-typed vaccination record) -- deleting
-- the source medicine_usage row cascades to remove its mirror too.
ALTER TABLE public.vaccination_records
  ADD COLUMN IF NOT EXISTS source_medicine_usage_id UUID REFERENCES public.medicine_usage(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vacc_records_source_usage
  ON public.vaccination_records(source_medicine_usage_id) WHERE source_medicine_usage_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_mirror_medicine_usage_to_vaccination()
RETURNS TRIGGER AS $body$
DECLARE
  v_is_vaccine boolean;
  v_name text;
BEGIN
  IF NEW.medicine_id IS NULL THEN
    DELETE FROM public.vaccination_records WHERE source_medicine_usage_id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT (type = 'vaccine'), name INTO v_is_vaccine, v_name
  FROM public.medicines_master WHERE id = NEW.medicine_id;

  IF NOT COALESCE(v_is_vaccine, false) THEN
    DELETE FROM public.vaccination_records WHERE source_medicine_usage_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO public.vaccination_records
    (flock_id, vaccine_date, vaccine_name, quantity, unit, remarks, medicine_id, source_medicine_usage_id)
  VALUES
    (NEW.flock_id, NEW.usage_date, v_name, NEW.quantity, NEW.unit, NEW.remarks, NEW.medicine_id, NEW.id)
  ON CONFLICT (source_medicine_usage_id) WHERE source_medicine_usage_id IS NOT NULL DO UPDATE SET
    flock_id = EXCLUDED.flock_id, vaccine_date = EXCLUDED.vaccine_date, vaccine_name = EXCLUDED.vaccine_name,
    quantity = EXCLUDED.quantity, unit = EXCLUDED.unit, remarks = EXCLUDED.remarks, medicine_id = EXCLUDED.medicine_id;

  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mirror_medicine_usage ON public.medicine_usage;
CREATE TRIGGER trg_mirror_medicine_usage
  AFTER INSERT OR UPDATE ON public.medicine_usage
  FOR EACH ROW EXECUTE FUNCTION public.fn_mirror_medicine_usage_to_vaccination();

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='vaccination_records' AND column_name IN ('medicine_id','source_medicine_usage_id');
SELECT count(*) AS trigger_exists FROM pg_trigger WHERE tgname='trg_mirror_medicine_usage';
