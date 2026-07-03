-- Two fixes to fn_grn_to_payment (audit findings #12, #17):
-- 1) Editing a GRN's amount recomputed pending_payments.invoice_amount but
--    left tds_amount/net_payable stale relative to the new total (if TDS was
--    set manually via Pending Payments). Recompute net_payable from the new
--    total minus the EXISTING tds_amount (tds_amount/tds_pct themselves are
--    left alone — only a human editing the bill should change the TDS rate).
-- 2) The trigger swallowed every real error silently (EXCEPTION WHEN OTHERS
--    THEN RETURN) with no trace at all. Keep the "never block a GRN save"
--    behavior (a broken payment sync must not lose farm data), but log the
--    error so it's at least visible in Postgres logs instead of vanishing.
CREATE OR REPLACE FUNCTION public.fn_grn_to_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_row     RECORD;
  v_vendor  TEXT;
  v_credit  INT;
  v_po_credit INT;
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

  SELECT id, name, COALESCE(credit_days, 0) INTO v_pid, v_vendor, v_credit
  FROM public.parties WHERE id = v_row.party_id;

  IF v_vendor IS NULL THEN
    RETURN v_row;
  END IF;

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

  IF v_total = 0 THEN
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
    net_payable    = GREATEST(0, v_total - COALESCE(public.pending_payments.tds_amount, 0)),
    grn_date       = v_earliest_date,
    invoice_no     = v_invoice_no,
    invoice_date   = COALESCE(v_invoice_date, v_earliest_date),
    party_id       = v_pid,
    credit_limit   = COALESCE(NULLIF(v_credit, 0), public.pending_payments.credit_limit),
    pay_before_date = CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE public.pending_payments.pay_before_date END;

  RETURN v_row;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_grn_to_payment error for grn_no=%, vendor=%: %', v_grn_no, v_vendor, SQLERRM;
  RETURN v_row;
END;
$$ LANGUAGE plpgsql;

SELECT 'ok' AS chk;
