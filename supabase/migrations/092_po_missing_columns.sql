-- Migration 092: Add missing columns to purchase_orders
-- credit_limit_days : payment credit term in days (drives pay_before_date auto-calc)
-- delivery_date     : expected delivery date (parsed from PDF PO import)
-- is_amendment      : flags a PO as an amendment to an earlier order

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS credit_limit_days INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_date     DATE,
  ADD COLUMN IF NOT EXISTS is_amendment      BOOLEAN DEFAULT FALSE;

-- Back-fill credit_limit_days from parties master for existing POs where possible
UPDATE public.purchase_orders po
SET    credit_limit_days = p.credit_days
FROM   public.parties p
WHERE  p.name ILIKE po.vendor_name
  AND  p.credit_days > 0
  AND  po.credit_limit_days IS NULL;

-- Back-fill pay_before_date on pending_payments where grn_date + credit_limit is known
-- but pay_before_date was never set
UPDATE public.pending_payments pp
SET    pay_before_date = pp.grn_date + pp.credit_limit
WHERE  pp.grn_date IS NOT NULL
  AND  pp.credit_limit IS NOT NULL
  AND  pp.credit_limit > 0
  AND  pp.pay_before_date IS NULL;

NOTIFY pgrst, 'reload schema';

-- Diagnostics
SELECT column_name
FROM   information_schema.columns
WHERE  table_schema = 'public'
  AND  table_name   = 'purchase_orders'
  AND  column_name  IN ('credit_limit_days','delivery_date','is_amendment');
