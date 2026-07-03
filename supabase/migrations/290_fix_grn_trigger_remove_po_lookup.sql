-- FINAL FIX: confirmed via information_schema (migrations 288, 289) that
-- public.grn has NO column matching '%po%' at all — no po_id, no po_no,
-- nothing. Migration 267's "prefer PO credit_limit_days over party
-- credit_days" feature was built against a column that never existed, so
-- fn_grn_to_payment() has been erroring (and being silently swallowed) on
-- every single GRN insert/update since. Migration 281 fixed the po_id
-- reference to po_no — still wrong, same bug, different nonexistent column.
-- This drops the PO-credit-days lookup entirely and returns to the
-- simpler, previously-working logic: party credit_days only (exactly how
-- GRN 2754-2757 synced correctly before 267 ever touched this function).

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

  SELECT id, name, COALESCE(credit_days, 0) INTO v_pid, v_vendor, v_credit
  FROM public.parties WHERE id = v_row.party_id;

  IF v_vendor IS NULL THEN
    RETURN v_row;
  END IF;

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

-- Backfill the 4 GRNs that were silently dropped (2758-2761), using only
-- columns confirmed real via information_schema + prior successful reads:
-- id, grn_no, grn_date, farm_id, party_id, total_amount, basic_amount,
-- invoice_no, invoice_date. No PO lookup.
INSERT INTO public.pending_payments
  (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
   invoice_amount, payment_status, credit_limit, pay_before_date)
SELECT
  p.name, p.id, g.grn_no, MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date),
  SUM(COALESCE(g.total_amount, g.basic_amount, 0)), 'Pending',
  NULLIF(COALESCE(p.credit_days, 0), 0),
  CASE WHEN COALESCE(p.credit_days, 0) > 0
       THEN MIN(g.grn_date) + COALESCE(p.credit_days, 0)
       ELSE NULL END
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
WHERE g.grn_no IN ('2758','2759','2760','2761')
GROUP BY p.name, p.id, g.grn_no, p.credit_days
ON CONFLICT (vendor_name, grn_no)
DO UPDATE SET
  invoice_amount = EXCLUDED.invoice_amount,
  net_payable    = GREATEST(0, EXCLUDED.invoice_amount - COALESCE(public.pending_payments.tds_amount, 0)),
  grn_date       = EXCLUDED.grn_date,
  invoice_no     = EXCLUDED.invoice_no,
  invoice_date   = EXCLUDED.invoice_date,
  party_id       = EXCLUDED.party_id,
  credit_limit   = COALESCE(EXCLUDED.credit_limit, public.pending_payments.credit_limit),
  pay_before_date = COALESCE(EXCLUDED.pay_before_date, public.pending_payments.pay_before_date);

SELECT vendor_name, grn_no, grn_date, invoice_amount, credit_limit
FROM public.pending_payments
WHERE grn_no IN ('2758','2759','2760','2761')
ORDER BY grn_no;
