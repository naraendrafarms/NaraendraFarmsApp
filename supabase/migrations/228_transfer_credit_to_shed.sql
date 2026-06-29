-- Migration 228: credit transferred birds to the destination shed.
-- Today a flock_transfer only reduces the source shed; the to-shed never gains the birds,
-- so they don't appear as the to-shed's opening next day. Fix: a trigger maintains the
-- to-shed's transfer_in on insert/update/delete (the source deduction stays in the app),
-- and the daily chain then carries transfer_in into the next day's opening.
-- fn_st_adjust (from migration 225) already adds a delta to a shed's daily record.

CREATE OR REPLACE FUNCTION public.fn_flock_transfer_credit() RETURNS trigger AS
$$
DECLARE vt UUID;
BEGIN
  -- reverse the old credit
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.to_shed_id IS NOT NULL THEN
    SELECT farm_id INTO vt FROM public.sheds WHERE id = OLD.to_shed_id;
    PERFORM public.fn_st_adjust(OLD.flock_id, vt, OLD.to_shed_id, OLD.transfer_date,
            -COALESCE(OLD.female_count,0), -COALESCE(OLD.male_count,0), false);
  END IF;
  -- apply the new credit
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.to_shed_id IS NOT NULL THEN
    SELECT farm_id INTO vt FROM public.sheds WHERE id = NEW.to_shed_id;
    PERFORM public.fn_st_adjust(NEW.flock_id, vt, NEW.to_shed_id, NEW.transfer_date,
            COALESCE(NEW.female_count,0), COALESCE(NEW.male_count,0), false);
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_flock_transfer_credit error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_flock_transfer_credit ON public.flock_transfers;
CREATE TRIGGER trg_flock_transfer_credit
  AFTER INSERT OR UPDATE OR DELETE ON public.flock_transfers
  FOR EACH ROW EXECUTE FUNCTION public.fn_flock_transfer_credit();

-- One-time backfill: credit to-shed for existing shed-level transfers (transfer_in was 0)
DO $$
DECLARE r RECORD; vt UUID;
BEGIN
  FOR r IN SELECT * FROM public.flock_transfers WHERE to_shed_id IS NOT NULL LOOP
    SELECT farm_id INTO vt FROM public.sheds WHERE id = r.to_shed_id;
    PERFORM public.fn_st_adjust(r.flock_id, vt, r.to_shed_id, r.transfer_date,
            COALESCE(r.female_count,0), COALESCE(r.male_count,0), false);
  END LOOP;
END $$;

SELECT 'check' AS chk, COUNT(*) AS shed_level_transfers FROM public.flock_transfers WHERE to_shed_id IS NOT NULL;
