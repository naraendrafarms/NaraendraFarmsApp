-- Migration 499's function/trigger failed: its plpgsql body used a
-- $body$ tag instead of a literal $$ marker, and this runner's statement
-- splitter only toggles dollar-quote state on the literal $$ sequence —
-- so it shredded the function body into fragments on every internal
-- semicolon (12 errors, confirmed in the job log). The ALTER TABLE /
-- index statements before it succeeded and are left untouched here.
CREATE OR REPLACE FUNCTION public.fn_mirror_medicine_usage_to_vaccination()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mirror_medicine_usage ON public.medicine_usage;
CREATE TRIGGER trg_mirror_medicine_usage
  AFTER INSERT OR UPDATE ON public.medicine_usage
  FOR EACH ROW EXECUTE FUNCTION public.fn_mirror_medicine_usage_to_vaccination();

SELECT count(*) AS trigger_exists FROM pg_trigger WHERE tgname='trg_mirror_medicine_usage';
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='vaccination_records' AND column_name IN ('medicine_id','source_medicine_usage_id');
