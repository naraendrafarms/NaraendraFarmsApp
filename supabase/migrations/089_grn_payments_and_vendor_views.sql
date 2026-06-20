-- Link GRN into Purchase & Payments + vendor statements + PO-vs-GRN rate check.
-- A GRN is a received goods bill, so every GRN should raise a supplier payable,
-- regardless of whether it was keyed in, imported, or saved via New Purchase.

-- 1. Trigger: each GRN row raises / accumulates a pending payment for its vendor.
--    One bill per (vendor_name, grn_no); multi-item GRNs sum into a single amount.
CREATE OR REPLACE FUNCTION public.fn_grn_to_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor TEXT;
  v_credit INT;
  v_amount NUMERIC;
BEGIN
  SELECT name, COALESCE(credit_days, 0) INTO v_vendor, v_credit
  FROM public.parties WHERE id = NEW.party_id;

  IF v_vendor IS NULL THEN
    RETURN NEW;
  END IF;

  v_amount := COALESCE(NEW.total_amount, NEW.basic_amount, 0);

  INSERT INTO public.pending_payments
    (vendor_name, grn_no, grn_date, invoice_date, invoice_amount,
     payment_status, credit_limit, pay_before_date)
  VALUES
    (v_vendor, NEW.grn_no, NEW.grn_date, COALESCE(NEW.invoice_date, NEW.grn_date),
     v_amount, 'Pending', NULLIF(v_credit, 0),
     CASE WHEN v_credit > 0 THEN NEW.grn_date + v_credit ELSE NULL END)
  ON CONFLICT (vendor_name, grn_no)
  DO UPDATE SET invoice_amount =
    COALESCE(public.pending_payments.invoice_amount, 0) + EXCLUDED.invoice_amount;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grn_to_payment ON public.grn;
CREATE TRIGGER trg_grn_to_payment
  AFTER INSERT ON public.grn
  FOR EACH ROW EXECUTE FUNCTION public.fn_grn_to_payment();

-- 2. Vendor statement: billed / paid / outstanding per supplier.
DROP VIEW IF EXISTS public.v_vendor_statement;
CREATE VIEW public.v_vendor_statement AS
  SELECT vendor_name,
         COUNT(*)                                                              AS bill_count,
         COALESCE(SUM(invoice_amount), 0)                                      AS total_billed,
         COALESCE(SUM(invoice_amount) FILTER (WHERE payment_status = 'Paid'), 0)  AS total_paid,
         COALESCE(SUM(invoice_amount) FILTER (WHERE payment_status <> 'Paid'), 0) AS outstanding,
         MAX(grn_date)                                                         AS last_bill_date
  FROM public.pending_payments
  GROUP BY vendor_name;

-- 3. PO rate vs GRN received rate, per GRN line, with the variance.
DROP VIEW IF EXISTS public.v_po_grn_rate;
CREATE VIEW public.v_po_grn_rate AS
  SELECT g.grn_no,
         g.grn_date,
         g.item_name,
         p.name                          AS vendor_name,
         g.price_per_unit                AS grn_rate,
         po.rate                         AS po_rate,
         po.po_no,
         (g.price_per_unit - po.rate)    AS rate_diff
  FROM public.grn g
  LEFT JOIN public.parties p ON p.id = g.party_id
  LEFT JOIN LATERAL (
    SELECT rate, po_no
    FROM public.purchase_orders po2
    WHERE po2.item_name = g.item_name
      AND po2.rate IS NOT NULL
    ORDER BY po2.po_date DESC NULLS LAST
    LIMIT 1
  ) po ON TRUE
  WHERE g.price_per_unit IS NOT NULL;
