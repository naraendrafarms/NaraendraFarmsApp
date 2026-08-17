-- Payment planning: part payments, deductions on manual items, and saved plans.
--
-- Checked before writing: pending_payments ALREADY has tds_pct, tds_amount and
-- net_payable, so TDS on a bill is handled and is NOT added again here. What is
-- missing is paying only PART of a bill, and a per-row discount instead of one
-- figure split evenly across everything selected.

-- 1. Manual items: gross, deduction and reason. `amount` stays as the NET, so
--    every existing row and every total that already reads it keeps working —
--    the new columns explain the number rather than replace it.
ALTER TABLE public.payment_plan_manual_items ADD COLUMN IF NOT EXISTS gross_amount numeric;
ALTER TABLE public.payment_plan_manual_items ADD COLUMN IF NOT EXISTS deduction_amount numeric;
ALTER TABLE public.payment_plan_manual_items ADD COLUMN IF NOT EXISTS deduction_reason text;

-- Existing rows were entered as a single figure with no deduction, so their
-- gross IS their amount. Filled in so the new Gross column is not blank on
-- rows that predate it.
UPDATE public.payment_plan_manual_items
SET gross_amount = amount, deduction_amount = 0
WHERE gross_amount IS NULL;

-- 2. Saved plans. Selection lived only in the screen: close the page and the
--    plan was gone, with no record of what was intended to be paid on a day to
--    set against what actually went out.
CREATE TABLE IF NOT EXISTS public.payment_plan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date   date NOT NULL,
  title       text,
  total_planned numeric NOT NULL DEFAULT 0,
  remarks     text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_plan_line (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      uuid NOT NULL REFERENCES public.payment_plan(id) ON DELETE CASCADE,
  payment_id   uuid,                 -- the pending_payments row, when there is one
  vendor_name  text,
  invoice_no   text,
  balance_due  numeric,              -- what was owed at the time the plan was made
  planned_amount numeric NOT NULL,   -- what was intended to be paid
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppl_plan ON public.payment_plan_line (plan_id);

-- RLS WITH a policy on both. Row security enabled and no policy denies every
-- write -- the fault that broke the Cull Bird page the day it shipped.
ALTER TABLE public.payment_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.payment_plan;
CREATE POLICY "auth_all" ON public.payment_plan FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.payment_plan_line ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.payment_plan_line;
CREATE POLICY "auth_all" ON public.payment_plan_line FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- VERIFY: columns present, tables present, and both policies in place.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'MISSING') AS manual_item_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='payment_plan_manual_items';

SELECT (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname='public' AND tablename='payment_plan') AS plan_policies,
       (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname='public' AND tablename='payment_plan_line') AS line_policies,
       (SELECT COUNT(*)::text FROM public.payment_plan_manual_items WHERE gross_amount IS NULL) AS manual_rows_without_gross;
