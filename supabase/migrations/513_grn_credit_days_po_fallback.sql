-- Credit Days for a Pending Payments bill only ever came from the vendor's
-- own parties.credit_days. If that's not set for a vendor, fall back to the
-- linked Purchase Order's own credit_limit_days (real column, confirmed via
-- migration 092 — this fallback was actually attempted once before,
-- migrations 267-286, but built against a nonexistent column at the time
-- and reverted in migration 290; grn.po_id exists for real now, migration
-- 439, so this can be done correctly).
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
  v_category TEXT;
  v_po_no   TEXT;
  v_po_credit INT;
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
         MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date), MIN(g.category)
    INTO v_total, v_earliest_date, v_invoice_no, v_invoice_date, v_category
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  WHERE p.name = v_vendor AND g.grn_no = v_grn_no;

  -- Pull the linked PO's po_no AND credit_limit_days in one lookup.
  SELECT po.po_no, po.credit_limit_days INTO v_po_no, v_po_credit
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  JOIN public.purchase_orders po ON po.id = g.po_id
  WHERE p.name = v_vendor AND g.grn_no = v_grn_no AND g.po_id IS NOT NULL
  LIMIT 1;

  -- Party's own credit_days wins when set; otherwise fall back to the
  -- linked PO's credit_limit_days.
  IF v_credit = 0 AND v_po_credit IS NOT NULL AND v_po_credit > 0 THEN
    v_credit := v_po_credit;
  END IF;

  IF v_total = 0 THEN
    DELETE FROM public.pending_payments
    WHERE vendor_name = v_vendor AND grn_no = v_grn_no AND payment_status <> 'Paid';
    RETURN v_row;
  END IF;

  INSERT INTO public.pending_payments
    (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
     invoice_amount, payment_status, credit_limit, pay_before_date, category, po_no)
  VALUES
    (v_vendor, v_pid, v_grn_no, v_earliest_date,
     v_invoice_no, COALESCE(v_invoice_date, v_earliest_date),
     v_total, 'Pending', NULLIF(v_credit, 0),
     CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE NULL END,
     v_category, v_po_no)
  ON CONFLICT (vendor_name, grn_no)
  DO UPDATE SET
    invoice_amount = v_total,
    net_payable    = GREATEST(0, v_total - COALESCE(public.pending_payments.tds_amount, 0)),
    grn_date       = v_earliest_date,
    invoice_no     = v_invoice_no,
    invoice_date   = COALESCE(v_invoice_date, v_earliest_date),
    party_id       = v_pid,
    credit_limit   = COALESCE(NULLIF(v_credit, 0), public.pending_payments.credit_limit),
    pay_before_date = CASE WHEN v_credit > 0 THEN v_earliest_date + v_credit ELSE public.pending_payments.pay_before_date END,
    category       = COALESCE(v_category, public.pending_payments.category),
    po_no          = COALESCE(v_po_no, public.pending_payments.po_no);

  RETURN v_row;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_grn_to_payment error for grn_no=%, vendor=%: %', v_grn_no, v_vendor, SQLERRM;
  RETURN v_row;
END;
$$ LANGUAGE plpgsql;

-- Backfill: any existing pending_payments row with no credit_limit, whose
-- GRN is linked to a PO carrying its own credit_limit_days, picks that up.
UPDATE public.pending_payments pp
SET credit_limit = sub.po_credit,
    pay_before_date = COALESCE(pp.pay_before_date, pp.grn_date + sub.po_credit)
FROM (
  SELECT p.name AS vendor_name, g.grn_no, MIN(po.credit_limit_days) AS po_credit
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  JOIN public.purchase_orders po ON po.id = g.po_id
  WHERE g.po_id IS NOT NULL AND po.credit_limit_days IS NOT NULL AND po.credit_limit_days > 0
  GROUP BY p.name, g.grn_no
) sub
WHERE pp.vendor_name = sub.vendor_name AND pp.grn_no = sub.grn_no
  AND (pp.credit_limit IS NULL OR pp.credit_limit = 0);

SELECT count(*) AS pending_payments_with_credit_limit FROM public.pending_payments WHERE credit_limit IS NOT NULL;
