-- Fixes two related bugs:
-- 1) trg_grn_to_payment only fired AFTER INSERT — editing an existing GRN
--    row (date, invoice_no, amount, party, etc. via GRNPage.tsx's plain
--    .update()) never re-synced pending_payments at all.
-- 2) The old INSERT-only logic did
--      invoice_amount = pending_payments.invoice_amount + EXCLUDED.invoice_amount
--    which is correct ONLY the first time a new GRN line under a shared
--    grn_no is added (multiple line items summing into one bill). Naively
--    adding UPDATE to that same logic would double-count every time an
--    existing line is edited and saved again.
--
-- Fix: recompute the pending_payments row for (vendor_name, grn_no) from
-- scratch — SUM every current grn row sharing that vendor+grn_no — on
-- INSERT, UPDATE, or DELETE. This is idempotent: editing/re-saving a GRN
-- line always lands on the correct total, never adds twice.

CREATE OR REPLACE FUNCTION public.fn_grn_to_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_row     RECORD;
  v_vendor  TEXT;
  v_credit  INT;
  v_pid     UUID;
  v_grn_no  TEXT;
  v_farm_id UUID;
  v_total   NUMERIC;
  v_earliest_date DATE;
  v_invoice_no TEXT;
  v_invoice_date DATE;
BEGIN
  v_row := COALESCE(NEW, OLD);
  v_grn_no := v_row.grn_no;
  v_farm_id := v_row.farm_id;

  -- Resolve vendor from whichever row still exists (NEW on insert/update)
  SELECT id, name, COALESCE(credit_days, 0) INTO v_pid, v_vendor, v_credit
  FROM public.parties WHERE id = v_row.party_id;

  IF v_vendor IS NULL THEN
    RETURN v_row;
  END IF;

  -- Recompute the true total + earliest date/invoice across every grn line
  -- currently sharing this vendor + grn_no (handles multi-line bills).
  SELECT COALESCE(SUM(COALESCE(g.total_amount, g.basic_amount, 0)), 0),
         MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date)
    INTO v_total, v_earliest_date, v_invoice_no, v_invoice_date
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  WHERE p.name = v_vendor AND g.grn_no = v_grn_no;

  IF v_total = 0 THEN
    -- No GRN lines left under this vendor+grn_no (last one deleted) — drop
    -- the mirrored pending_payments row too, if unpaid.
    DELETE FROM public.pending_payments
    WHERE vendor_name = v_vendor AND grn_no = v_grn_no AND payment_status <> 'Paid';
    RETURN v_row;
  END IF;

  INSERT INTO public.pending_payments
    (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
     invoice_amount, payment_status, credit_limit, pay_before_date)
  VALUES
    (v_vendor, v_pid, v_grn_no, v_earliest_date,
     v_invoice_no, COALESCE(v_invoice_date, v_earliest_date),
     v_total, 'Pending', NULLIF(v_credit, 0),
     CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE NULL END)
  ON CONFLICT (vendor_name, grn_no)
  DO UPDATE SET
    invoice_amount = v_total,
    grn_date       = v_earliest_date,
    invoice_no     = v_invoice_no,
    invoice_date   = COALESCE(v_invoice_date, v_earliest_date),
    party_id       = v_pid,
    pay_before_date = CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE public.pending_payments.pay_before_date END;

  RETURN v_row;
EXCEPTION WHEN OTHERS THEN
  RETURN v_row;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grn_to_payment ON public.grn;
CREATE TRIGGER trg_grn_to_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.grn
  FOR EACH ROW EXECUTE FUNCTION public.fn_grn_to_payment();

SELECT 'ok' AS chk;
