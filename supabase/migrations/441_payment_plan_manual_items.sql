-- Payment Planning: ad-hoc "Manual Item" list — covers real upcoming cash
-- in/out that has no bill row anywhere yet (a pending salary for one
-- employee, an advance you know you'll need to pay next month, etc.).
-- Deliberately NOT wired into pending_payments/salary_monthly/advances —
-- those each have their own tested paid/unpaid flow already; this is just a
-- visibility placeholder on the Payment Planning page until the real entry
-- is made properly, at which point the manual row is deleted by hand.
CREATE TABLE IF NOT EXISTS public.payment_plan_manual_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  direction    TEXT NOT NULL CHECK (direction IN ('payable','receivable')),
  due_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_plan_manual_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_plan_manual_items_select ON public.payment_plan_manual_items FOR SELECT TO authenticated USING (true);
CREATE POLICY payment_plan_manual_items_insert ON public.payment_plan_manual_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY payment_plan_manual_items_update ON public.payment_plan_manual_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY payment_plan_manual_items_delete ON public.payment_plan_manual_items FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_audit ON public.payment_plan_manual_items;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.payment_plan_manual_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='payment_plan_manual_items';
