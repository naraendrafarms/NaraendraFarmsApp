-- Reproduce fn_grn_to_payment's insert logic for the unsynced GRN 2758 inside
-- a DO block so we can capture the real SQLSTATE/SQLERRM instead of it being
-- silently swallowed by the trigger's own EXCEPTION WHEN OTHERS. Read-only —
-- wrapped so nothing is actually written (raises after building the values).

CREATE TEMP TABLE IF NOT EXISTS tmp_trigger_repro (msg TEXT, state TEXT);
TRUNCATE tmp_trigger_repro;

DO $$
DECLARE
  v_row     RECORD;
  v_vendor  TEXT;
  v_credit  INT;
  v_po_credit INT;
  v_pid     UUID;
  v_grn_no  TEXT := '2758';
  v_total   NUMERIC;
  v_earliest_date DATE;
  v_invoice_no TEXT;
  v_invoice_date DATE;
BEGIN
  SELECT * INTO v_row FROM public.grn WHERE grn_no = v_grn_no LIMIT 1;

  SELECT id, name, COALESCE(credit_days, 0) INTO v_pid, v_vendor, v_credit
  FROM public.parties WHERE id = v_row.party_id;

  IF v_row.po_id IS NOT NULL THEN
    SELECT credit_limit_days INTO v_po_credit FROM public.purchase_orders WHERE id = v_row.po_id;
  END IF;
  v_credit := COALESCE(v_po_credit, v_credit, 0);

  SELECT COALESCE(SUM(COALESCE(g.total_amount, g.basic_amount, 0)), 0),
         MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date)
    INTO v_total, v_earliest_date, v_invoice_no, v_invoice_date
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  WHERE p.name = v_vendor AND g.grn_no = v_grn_no;

  -- Actually attempt the insert inside a subtransaction so we can roll it back
  DECLARE
    v_ok BOOLEAN := false;
    v_msg TEXT := NULL;
    v_state TEXT := NULL;
  BEGIN
    BEGIN
      INSERT INTO public.pending_payments
        (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
         invoice_amount, payment_status, credit_limit, pay_before_date)
      VALUES
        (v_vendor, v_pid, v_grn_no, v_earliest_date,
         v_invoice_no, COALESCE(v_invoice_date, v_earliest_date),
         v_total, 'Pending', NULLIF(v_credit, 0),
         CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE NULL END)
      ON CONFLICT (vendor_name, grn_no)
      DO UPDATE SET invoice_amount = EXCLUDED.invoice_amount;
      v_ok := true;
    EXCEPTION WHEN OTHERS THEN
      v_msg := SQLERRM;
      v_state := SQLSTATE;
    END;
    -- always roll back the probe insert itself, regardless of outcome
    RAISE EXCEPTION 'rollback_probe';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'rollback_probe' THEN
      IF v_ok THEN
        INSERT INTO tmp_trigger_repro VALUES ('SUCCESS: insert/update worked fine, total=' || v_total, 'OK');
      ELSE
        INSERT INTO tmp_trigger_repro VALUES (v_msg, v_state);
      END IF;
    ELSE
      INSERT INTO tmp_trigger_repro VALUES (SQLERRM, SQLSTATE);
    END IF;
  END;
END $$;

SELECT * FROM tmp_trigger_repro;
