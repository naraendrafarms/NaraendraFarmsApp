-- ROOT CAUSE FOUND: migration 267 introduced `v_row.po_id` in
-- fn_grn_to_payment() to prefer the PO's credit_limit_days over the party's
-- credit_days. But the `grn` table has NO `po_id` column — it only has
-- `po_no` (TEXT). Every GRN insert/update since 267 was applied has hit
-- `record "v_row" has no field "po_id"` (SQLSTATE 42703), which the
-- trigger's own `EXCEPTION WHEN OTHERS THEN RETURN` swallows completely —
-- so GRNs saved fine but silently stopped creating/updating Pending
-- Payments rows. Confirmed via migration 280's rollback-probe reproduction.
-- Fix: look up the PO's credit_limit_days by po_no instead of a nonexistent
-- po_id, and backfill the pending_payments rows for the GRNs that were
-- silently dropped (2758-2761) — a normal upsert of already-live GRN data,
-- not a destructive change.

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

  IF v_row.po_no IS NOT NULL THEN
    SELECT credit_limit_days INTO v_po_credit
    FROM public.purchase_orders WHERE po_no = v_row.po_no
    AND credit_limit_days IS NOT NULL LIMIT 1;
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

-- Backfill: run the corrected upsert logic directly for the 4 GRNs that
-- were silently dropped while the bug was live. Deliberately NOT touching
-- the grn table itself (a no-op UPDATE would also re-fire
-- trg_grn_stock_ledger and trg_audit, risking duplicate stock-ledger
-- entries) — just the same INSERT ... ON CONFLICT the trigger itself runs.
DO $$
DECLARE
  v_grn_no TEXT;
  v_pid UUID; v_vendor TEXT; v_credit INT; v_po_credit INT;
  v_total NUMERIC; v_earliest_date DATE; v_invoice_no TEXT; v_invoice_date DATE;
  v_po_no TEXT;
BEGIN
  FOREACH v_grn_no IN ARRAY ARRAY['2758','2759','2760','2761']
  LOOP
    SELECT po_no INTO v_po_no FROM public.grn WHERE grn_no = v_grn_no LIMIT 1;

    SELECT p.id, p.name, COALESCE(p.credit_days, 0)
      INTO v_pid, v_vendor, v_credit
    FROM public.grn g JOIN public.parties p ON p.id = g.party_id
    WHERE g.grn_no = v_grn_no LIMIT 1;

    IF v_po_no IS NOT NULL THEN
      SELECT credit_limit_days INTO v_po_credit
      FROM public.purchase_orders WHERE po_no = v_po_no
      AND credit_limit_days IS NOT NULL LIMIT 1;
    END IF;
    v_credit := COALESCE(v_po_credit, v_credit, 0);

    SELECT COALESCE(SUM(COALESCE(g.total_amount, g.basic_amount, 0)), 0),
           MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date)
      INTO v_total, v_earliest_date, v_invoice_no, v_invoice_date
    FROM public.grn g JOIN public.parties p ON p.id = g.party_id
    WHERE p.name = v_vendor AND g.grn_no = v_grn_no;

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
  END LOOP;
END $$;

-- Verify
SELECT vendor_name, grn_no, grn_date, invoice_amount, credit_limit, pay_before_date
FROM public.pending_payments
WHERE grn_no IN ('2758','2759','2760','2761')
ORDER BY grn_no;
