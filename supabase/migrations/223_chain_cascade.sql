-- Migration 223: make the opening/closing chain self-healing. 200 set opening=prev
-- closing on each write, but editing an earlier day did NOT update later days (cascade
-- gap) — that's why flock 20 showed 24th closing 32473 but 25th opening 32474.
-- (1) Re-chain all existing rows. (2) Add an AFTER trigger that pushes a changed closing
--     into the next day's opening, which re-fires and cascades forward.

-- (1) One-time re-chain (per flock + shed, in date order)
DO $$
DECLARE
  r RECORD; prev_key TEXT := NULL; cur_key TEXT;
  carry_f INT := NULL; carry_m INT := NULL;
  nf INT; nm INT; cf INT; cm INT;
BEGIN
  FOR r IN
    SELECT id, flock_id, shed_id, record_date,
           COALESCE(opening_female,0) AS of, COALESCE(opening_male,0) AS om,
           COALESCE(mortality_female,0) AS mf, COALESCE(mortality_male,0) AS mm,
           COALESCE(cull_female,0) AS cfl, COALESCE(cull_male,0) AS cml,
           COALESCE(transfer_female,0) AS tf, COALESCE(transfer_male,0) AS tm
    FROM public.daily_records
    ORDER BY flock_id, shed_id NULLS FIRST, record_date, id
  LOOP
    cur_key := r.flock_id::text || '|' || COALESCE(r.shed_id::text,'_');
    IF cur_key IS DISTINCT FROM prev_key THEN nf := r.of; nm := r.om;
    ELSE nf := COALESCE(carry_f, r.of); nm := COALESCE(carry_m, r.om); END IF;
    cf := GREATEST(0, nf - r.mf - r.cfl - r.tf);
    cm := GREATEST(0, nm - r.mm - r.cml - r.tm);
    UPDATE public.daily_records SET opening_female=nf, opening_male=nm,
           closing_female=cf, closing_male=cm WHERE id = r.id;
    carry_f := cf; carry_m := cm; prev_key := cur_key;
  END LOOP;
END $$;

-- (2) Cascade trigger: when a row's closing changes (or on insert), update the next day
CREATE OR REPLACE FUNCTION public.fn_chain_cascade() RETURNS trigger AS
$$
DECLARE nxt RECORD;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.closing_female IS NOT DISTINCT FROM OLD.closing_female
     AND NEW.closing_male   IS NOT DISTINCT FROM OLD.closing_male THEN
    RETURN NEW;
  END IF;
  SELECT id, opening_female, opening_male INTO nxt
  FROM public.daily_records
  WHERE flock_id = NEW.flock_id
    AND (shed_id = NEW.shed_id OR (shed_id IS NULL AND NEW.shed_id IS NULL))
    AND record_date > NEW.record_date AND id <> NEW.id
  ORDER BY record_date ASC, id ASC LIMIT 1;
  IF FOUND AND (nxt.opening_female IS DISTINCT FROM NEW.closing_female
             OR nxt.opening_male   IS DISTINCT FROM NEW.closing_male) THEN
    UPDATE public.daily_records
      SET opening_female = NEW.closing_female, opening_male = NEW.closing_male
      WHERE id = nxt.id;  -- fires BEFORE (recompute closing) + AFTER (cascade onward)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chain_cascade ON public.daily_records;
CREATE TRIGGER trg_chain_cascade
  AFTER INSERT OR UPDATE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_chain_cascade();

-- Verify: rows where opening <> previous day's closing (want 0)
SELECT 'mismatches' AS chk, COUNT(*) AS n FROM (
  SELECT opening_female,
    LAG(closing_female) OVER (PARTITION BY flock_id, shed_id ORDER BY record_date, id) AS prev_close
  FROM public.daily_records) t
WHERE prev_close IS NOT NULL AND opening_female <> prev_close;
