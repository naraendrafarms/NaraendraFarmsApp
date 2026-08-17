-- Editing a GRN's number (or its vendor) created a SECOND bill in Pending
-- Payments instead of updating the first.
--
-- Why: fn_grn_to_payment upserts on (vendor_name, grn_no). Change either half
-- and ON CONFLICT finds nothing to update, so it INSERTs. The original row --
-- often already paid -- stays behind as Pending, inflating what the farm
-- appears to owe. That is how More Than Solutions ended up with two rows for
-- GRN 2743, one Paid with the bank debit attached and one Pending at 1,17,000.
--
-- The fix: when a GRN's number or vendor changes, MOVE the existing bill to the
-- new key first. The normal trigger then finds it and updates it, exactly as it
-- would for any other edit.
--
-- Tying the bill to a grn id instead was considered and rejected: a GRN is
-- several line rows sharing one number, so there is no single id to point at.
--
-- Guards, in order:
--   * only move when no OTHER line still uses the old number for that vendor --
--     otherwise the old bill still has lines behind it and must stay;
--   * if a bill already exists at the new key, do not move on top of it; drop
--     the old one only when it is unpaid, and leave it alone when it carries
--     money so nothing settled is ever destroyed by an edit.

CREATE OR REPLACE FUNCTION public.fn_grn_renumber_moves_bill()
RETURNS TRIGGER AS $fn$
DECLARE
  v_old_vendor text;
  v_new_vendor text;
  v_target_exists boolean;
  v_old_paid numeric;
BEGIN
  IF NEW.grn_no IS NOT DISTINCT FROM OLD.grn_no
     AND NEW.party_id IS NOT DISTINCT FROM OLD.party_id THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_old_vendor FROM public.parties WHERE id = OLD.party_id;
  SELECT name INTO v_new_vendor FROM public.parties WHERE id = NEW.party_id;
  IF v_old_vendor IS NULL OR v_new_vendor IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.grn g
    JOIN public.parties p ON p.id = g.party_id
    WHERE g.grn_no = OLD.grn_no AND p.name = v_old_vendor AND g.id <> NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.pending_payments
    WHERE vendor_name = v_new_vendor AND grn_no = NEW.grn_no
  ) INTO v_target_exists;

  IF v_target_exists THEN
    SELECT COALESCE(SUM(COALESCE(paid_amount,0) + COALESCE(advance_adjusted,0)), 0)
      INTO v_old_paid
    FROM public.pending_payments
    WHERE vendor_name = v_old_vendor AND grn_no = OLD.grn_no;

    IF v_old_paid = 0 THEN
      DELETE FROM public.pending_payments
      WHERE vendor_name = v_old_vendor AND grn_no = OLD.grn_no
        AND COALESCE(paid_amount,0) = 0
        AND COALESCE(advance_adjusted,0) = 0
        AND COALESCE(payment_status,'Pending') <> 'Paid';
    END IF;
    RETURN NEW;
  END IF;

  UPDATE public.pending_payments
  SET grn_no = NEW.grn_no, vendor_name = v_new_vendor, party_id = NEW.party_id
  WHERE vendor_name = v_old_vendor AND grn_no = OLD.grn_no;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_grn_renumber_moves_bill error on grn % -> %: %', OLD.grn_no, NEW.grn_no, SQLERRM;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grn_renumber_moves_bill ON public.grn;

CREATE TRIGGER trg_grn_renumber_moves_bill
BEFORE UPDATE ON public.grn
FOR EACH ROW
EXECUTE FUNCTION public.fn_grn_renumber_moves_bill();

SELECT COALESCE(string_agg(tgname, ', '), 'TRIGGER MISSING') AS triggers_on_grn
FROM pg_trigger WHERE tgrelid = 'public.grn'::regclass AND NOT tgisinternal;

SELECT COUNT(*)::text AS duplicate_bill_groups_now
FROM (SELECT vendor_name, grn_no FROM public.pending_payments
      WHERE COALESCE(NULLIF(grn_no,''), NULL) IS NOT NULL
      GROUP BY vendor_name, grn_no HAVING COUNT(*) > 1) x;
