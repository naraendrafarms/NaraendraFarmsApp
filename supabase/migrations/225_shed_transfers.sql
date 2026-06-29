-- Migration 225: Shed-to-shed transfers within a flock/site.
-- Adds transfer_in to daily_records, a shed_transfers ledger, and a trigger that posts
-- each transfer to the from-shed (transfer out) and to-shed (transfer in) daily records.
-- The existing chain triggers then keep both sheds' opening/closing correct.

ALTER TABLE public.daily_records ADD COLUMN IF NOT EXISTS transfer_in_female INT DEFAULT 0;
ALTER TABLE public.daily_records ADD COLUMN IF NOT EXISTS transfer_in_male   INT DEFAULT 0;

-- Closing = opening + transfer_in - mortality - cull - transfer_out
CREATE OR REPLACE FUNCTION public.fn_chain_daily_opening() RETURNS trigger AS
$$
DECLARE prev RECORD;
BEGIN
  SELECT closing_female, closing_male INTO prev
  FROM public.daily_records
  WHERE flock_id = NEW.flock_id AND record_date < NEW.record_date
    AND (shed_id = NEW.shed_id OR (shed_id IS NULL AND NEW.shed_id IS NULL))
    AND id <> NEW.id
  ORDER BY record_date DESC, id DESC LIMIT 1;
  IF FOUND THEN
    NEW.opening_female := prev.closing_female;
    NEW.opening_male   := prev.closing_male;
  END IF;
  NEW.closing_female := GREATEST(0, COALESCE(NEW.opening_female,0) + COALESCE(NEW.transfer_in_female,0)
      - COALESCE(NEW.mortality_female,0) - COALESCE(NEW.cull_female,0) - COALESCE(NEW.transfer_female,0));
  NEW.closing_male := GREATEST(0, COALESCE(NEW.opening_male,0) + COALESCE(NEW.transfer_in_male,0)
      - COALESCE(NEW.mortality_male,0) - COALESCE(NEW.cull_male,0) - COALESCE(NEW.transfer_male,0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- shed_transfers ledger
CREATE TABLE IF NOT EXISTS public.shed_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES public.flocks(id) ON DELETE CASCADE,
  from_shed_id UUID REFERENCES public.sheds(id),
  to_shed_id UUID REFERENCES public.sheds(id),
  transfer_date DATE NOT NULL,
  female INT DEFAULT 0,
  male INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shed_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shed_transfers_auth_all ON public.shed_transfers;
CREATE POLICY shed_transfers_auth_all ON public.shed_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shed_transfers TO authenticated;

-- Helper: add a delta to a shed's daily record for a date (creating the row if needed)
CREATE OR REPLACE FUNCTION public.fn_st_adjust(p_flock UUID, p_farm UUID, p_shed UUID, p_date DATE,
  p_df INT, p_dm INT, p_out BOOLEAN) RETURNS void AS
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.daily_records
    WHERE flock_id=p_flock AND record_date=p_date
      AND shed_id IS NOT DISTINCT FROM p_shed AND farm_id IS NOT DISTINCT FROM p_farm) THEN
    INSERT INTO public.daily_records(flock_id, farm_id, shed_id, record_date,
      opening_female, opening_male, transfer_female, transfer_male,
      transfer_in_female, transfer_in_male, mortality_female, mortality_male, cull_female, cull_male)
    VALUES(p_flock, p_farm, p_shed, p_date, 0,0,0,0,0,0,0,0,0,0);
  END IF;
  IF p_out THEN
    UPDATE public.daily_records
      SET transfer_female = COALESCE(transfer_female,0)+p_df, transfer_male = COALESCE(transfer_male,0)+p_dm
    WHERE flock_id=p_flock AND record_date=p_date AND shed_id IS NOT DISTINCT FROM p_shed AND farm_id IS NOT DISTINCT FROM p_farm;
  ELSE
    UPDATE public.daily_records
      SET transfer_in_female = COALESCE(transfer_in_female,0)+p_df, transfer_in_male = COALESCE(transfer_in_male,0)+p_dm
    WHERE flock_id=p_flock AND record_date=p_date AND shed_id IS NOT DISTINCT FROM p_shed AND farm_id IS NOT DISTINCT FROM p_farm;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: apply / reverse a shed transfer onto the two sheds' daily records
CREATE OR REPLACE FUNCTION public.fn_shed_transfer_apply() RETURNS trigger AS
$$
DECLARE vf UUID; vt UUID;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT farm_id INTO vf FROM public.sheds WHERE id = OLD.from_shed_id;
    SELECT farm_id INTO vt FROM public.sheds WHERE id = OLD.to_shed_id;
    PERFORM public.fn_st_adjust(OLD.flock_id, vf, OLD.from_shed_id, OLD.transfer_date, -OLD.female, -OLD.male, true);
    PERFORM public.fn_st_adjust(OLD.flock_id, vt, OLD.to_shed_id,   OLD.transfer_date, -OLD.female, -OLD.male, false);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT farm_id INTO vf FROM public.sheds WHERE id = NEW.from_shed_id;
    SELECT farm_id INTO vt FROM public.sheds WHERE id = NEW.to_shed_id;
    PERFORM public.fn_st_adjust(NEW.flock_id, vf, NEW.from_shed_id, NEW.transfer_date, NEW.female, NEW.male, true);
    PERFORM public.fn_st_adjust(NEW.flock_id, vt, NEW.to_shed_id,   NEW.transfer_date, NEW.female, NEW.male, false);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shed_transfer_apply ON public.shed_transfers;
CREATE TRIGGER trg_shed_transfer_apply
  AFTER INSERT OR UPDATE OR DELETE ON public.shed_transfers
  FOR EACH ROW EXECUTE FUNCTION public.fn_shed_transfer_apply();

-- Re-chain so the new transfer_in is reflected in existing closings
DO $$
DECLARE r RECORD; prev_key TEXT := NULL; cur_key TEXT;
  carry_f INT := NULL; carry_m INT := NULL; nf INT; nm INT; cf INT; cm INT;
BEGIN
  FOR r IN
    SELECT id, flock_id, shed_id, COALESCE(opening_female,0) AS of, COALESCE(opening_male,0) AS om,
      COALESCE(transfer_in_female,0) AS tif, COALESCE(transfer_in_male,0) AS tim,
      COALESCE(mortality_female,0) AS mf, COALESCE(mortality_male,0) AS mm,
      COALESCE(cull_female,0) AS cfl, COALESCE(cull_male,0) AS cml,
      COALESCE(transfer_female,0) AS tf, COALESCE(transfer_male,0) AS tm
    FROM public.daily_records ORDER BY flock_id, shed_id NULLS FIRST, record_date, id
  LOOP
    cur_key := r.flock_id::text || '|' || COALESCE(r.shed_id::text,'_');
    IF cur_key IS DISTINCT FROM prev_key THEN nf := r.of; nm := r.om;
    ELSE nf := COALESCE(carry_f, r.of); nm := COALESCE(carry_m, r.om); END IF;
    cf := GREATEST(0, nf + r.tif - r.mf - r.cfl - r.tf);
    cm := GREATEST(0, nm + r.tim - r.mm - r.cml - r.tm);
    UPDATE public.daily_records SET opening_female=nf, opening_male=nm, closing_female=cf, closing_male=cm WHERE id=r.id;
    carry_f := cf; carry_m := cm; prev_key := cur_key;
  END LOOP;
END $$;

SELECT 'ok' AS chk, COUNT(*) AS shed_transfers_rows FROM public.shed_transfers;
