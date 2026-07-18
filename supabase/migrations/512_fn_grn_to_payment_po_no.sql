-- fn_grn_to_payment() (last redefined in migration 415) has never written
-- po_no onto pending_payments, in any version — migration 290 explicitly
-- dropped a PO lookup because grn.po_id/po_no didn't exist yet at the time
-- (see its comment), and nothing restored it after migration 439 later
-- added grn.po_id for real. So a GRN linked to a PO still leaves Pending
-- Payments' "PO Number" blank forever. Add the PO lookup back, sourcing
-- po_no from grn.po_id -> purchase_orders.po_no (real column, confirmed via
-- migration 011). Credit Days is unaffected by this fix — it only ever came
-- from parties.credit_days (purchase_orders has no credit-terms column of
-- its own), and that part of the trigger already works correctly.
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

  -- Pull the linked PO's own po_no (any GRN row in this batch that carries
  -- a po_id wins) so Pending Payments shows which PO this bill traces to.
  SELECT po.po_no INTO v_po_no
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  JOIN public.purchase_orders po ON po.id = g.po_id
  WHERE p.name = v_vendor AND g.grn_no = v_grn_no AND g.po_id IS NOT NULL
  LIMIT 1;

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

-- Backfill po_no onto existing GRN-linked pending_payments rows that are
-- still blank, from whichever linked PO their GRN batch carries.
UPDATE public.pending_payments pp
SET po_no = sub.po_no
FROM (
  SELECT p.name AS vendor_name, g.grn_no, MIN(po.po_no) AS po_no
  FROM public.grn g
  JOIN public.parties p ON p.id = g.party_id
  JOIN public.purchase_orders po ON po.id = g.po_id
  WHERE g.po_id IS NOT NULL
  GROUP BY p.name, g.grn_no
) sub
WHERE pp.vendor_name = sub.vendor_name AND pp.grn_no = sub.grn_no AND pp.po_no IS NULL;

SELECT count(*) AS backfilled_po_no FROM public.pending_payments WHERE po_no IS NOT NULL;
