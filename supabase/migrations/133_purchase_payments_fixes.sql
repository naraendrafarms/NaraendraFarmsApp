-- Migration 133: Purchase & Payments improvements
-- 1. Add discount / partial-payment tracking to pending_payments
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason  TEXT,
  ADD COLUMN IF NOT EXISTS paid_amount      NUMERIC(14,2) DEFAULT 0;

-- 2. Add payment_status to purchase_orders so the PO-tab Pay-Status filter works
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';

-- 3. Refresh fn_grn_to_payment to also store party_id when known
CREATE OR REPLACE FUNCTION public.fn_grn_to_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor  TEXT;
  v_credit  INT;
  v_amount  NUMERIC;
  v_pid     UUID;
BEGIN
  SELECT id, name, COALESCE(credit_days, 0)
    INTO v_pid, v_vendor, v_credit
  FROM public.parties WHERE id = NEW.party_id;

  IF v_vendor IS NULL THEN
    RETURN NEW;
  END IF;

  v_amount := COALESCE(NEW.total_amount, NEW.basic_amount, 0);

  INSERT INTO public.pending_payments
    (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
     invoice_amount, payment_status, credit_limit, pay_before_date)
  VALUES
    (v_vendor, v_pid, NEW.grn_no, NEW.grn_date,
     NEW.invoice_no,
     COALESCE(NEW.invoice_date, NEW.grn_date),
     v_amount, 'Pending', NULLIF(v_credit, 0),
     CASE WHEN v_credit > 0 THEN NEW.grn_date + v_credit ELSE NULL END)
  ON CONFLICT (vendor_name, grn_no)
  DO UPDATE SET
    invoice_amount = COALESCE(public.pending_payments.invoice_amount, 0) + EXCLUDED.invoice_amount,
    party_id       = EXCLUDED.party_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Add party_id FK column to pending_payments (no constraint — just a reference hint for PostgREST)
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS party_id UUID;

-- 5. Update v_vendor_statement to handle partial payments (paid_amount)
DROP VIEW IF EXISTS public.v_vendor_statement;
CREATE VIEW public.v_vendor_statement AS
  SELECT
    vendor_name,
    COUNT(*)                                                                   AS bill_count,
    COALESCE(SUM(invoice_amount), 0)                                           AS total_billed,
    COALESCE(
      SUM(CASE WHEN payment_status = 'Paid'
               THEN COALESCE(invoice_amount, 0)
               ELSE COALESCE(paid_amount, 0) END), 0)                          AS total_paid,
    COALESCE(
      SUM(CASE WHEN payment_status = 'Paid' THEN 0
               ELSE GREATEST(0,
                 COALESCE(net_payable, invoice_amount, 0)
                 - COALESCE(discount_amount, 0)
                 - COALESCE(paid_amount, 0)) END), 0)                          AS outstanding,
    MAX(grn_date)                                                              AS last_bill_date
  FROM public.pending_payments
  GROUP BY vendor_name;

-- Diagnostic
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pending_payments'
   AND column_name='discount_amount') AS discount_col,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='purchase_orders'
   AND column_name='payment_status') AS po_pay_status_col;
