-- Migration 200: PERMANENT fix for the opening/closing bird-count chain.
-- Problem: a day's opening sometimes does not equal the previous day's closing
-- (e.g. flock 20: 24th closing 32473 but 25th opening 32474). This happens because
-- opening can be typed/imported independently of the prior closing. Frontend only
-- pre-fills opening in the entry form, so imports/bulk/edits can break the chain.
--
-- Fix = two parts:
--   (1) one-time recompute of all existing rows so every opening = prev closing and
--       closing = opening - mortality - cull - transfer (per flock + shed, date order)
--   (2) a BEFORE INSERT/UPDATE trigger that enforces the same rule on every future
--       write, so the chain can never drift again regardless of entry method.

-- Safety backup
CREATE TABLE IF NOT EXISTS public.daily_records_chain_backup_200 AS
SELECT id, flock_id, shed_id, record_date, opening_female, opening_male,
       closing_female, closing_male
FROM public.daily_records;

-- ── (1) One-time recompute ───────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
  prev_key TEXT := NULL;
  cur_key  TEXT;
  carry_f  INT := NULL;
  carry_m  INT := NULL;
  new_open_f INT;
  new_open_m INT;
  new_close_f INT;
  new_close_m INT;
BEGIN
  FOR r IN
    SELECT id, flock_id, shed_id, record_date,
           COALESCE(opening_female,0) AS of, COALESCE(opening_male,0) AS om,
           COALESCE(mortality_female,0) AS mf, COALESCE(mortality_male,0) AS mm,
           COALESCE(cull_female,0) AS cf, COALESCE(cull_male,0) AS cm,
           COALESCE(transfer_female,0) AS tf, COALESCE(transfer_male,0) AS tm
    FROM public.daily_records
    ORDER BY flock_id, shed_id NULLS FIRST, record_date, id
  LOOP
    cur_key := r.flock_id::text || '|' || COALESCE(r.shed_id::text,'_');
    IF cur_key IS DISTINCT FROM prev_key THEN
      -- first record of a new flock/shed group: keep its own opening (placement day)
      new_open_f := r.of;
      new_open_m := r.om;
    ELSE
      new_open_f := COALESCE(carry_f, r.of);
      new_open_m := COALESCE(carry_m, r.om);
    END IF;
    new_close_f := GREATEST(0, new_open_f - r.mf - r.cf - r.tf);
    new_close_m := GREATEST(0, new_open_m - r.mm - r.cm - r.tm);

    UPDATE public.daily_records
      SET opening_female = new_open_f, opening_male = new_open_m,
          closing_female = new_close_f, closing_male = new_close_m
      WHERE id = r.id;

    carry_f := new_close_f;
    carry_m := new_close_m;
    prev_key := cur_key;
  END LOOP;
END $$;

-- ── (2) Trigger to keep the chain correct on every future write ───────────────
CREATE OR REPLACE FUNCTION public.fn_chain_daily_opening() RETURNS trigger AS $$
DECLARE prev RECORD;
BEGIN
  SELECT closing_female, closing_male INTO prev
  FROM public.daily_records
  WHERE flock_id = NEW.flock_id
    AND record_date < NEW.record_date
    AND (shed_id = NEW.shed_id OR (shed_id IS NULL AND NEW.shed_id IS NULL))
    AND id <> NEW.id
  ORDER BY record_date DESC, id DESC
  LIMIT 1;

  IF FOUND THEN
    NEW.opening_female := prev.closing_female;
    NEW.opening_male   := prev.closing_male;
  END IF;

  NEW.closing_female := GREATEST(0, COALESCE(NEW.opening_female,0)
      - COALESCE(NEW.mortality_female,0) - COALESCE(NEW.cull_female,0) - COALESCE(NEW.transfer_female,0));
  NEW.closing_male := GREATEST(0, COALESCE(NEW.opening_male,0)
      - COALESCE(NEW.mortality_male,0) - COALESCE(NEW.cull_male,0) - COALESCE(NEW.transfer_male,0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chain_daily_opening ON public.daily_records;
CREATE TRIGGER trg_chain_daily_opening
  BEFORE INSERT OR UPDATE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_chain_daily_opening();

-- Verify: count rows where opening <> previous day's closing (should be 0)
WITH chained AS (
  SELECT id, flock_id, shed_id, record_date, opening_female,
         LAG(closing_female) OVER (PARTITION BY flock_id, shed_id ORDER BY record_date, id) AS prev_close
  FROM public.daily_records
)
SELECT 'mismatches_after' AS chk, COUNT(*) AS n
FROM chained WHERE prev_close IS NOT NULL AND opening_female <> prev_close;
