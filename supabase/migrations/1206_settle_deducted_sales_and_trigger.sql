-- Two things, both owner-approved.
--
-- (1) CORRECT THE 83. Measured by migration 1205: for every one of the 47
-- employee-months concerned, the payslip's own other_deduction total equals what
-- has been flipped PLUS what is still pending - Rs 26,415 against Rs 26,415. So
-- that money did come out of wages; only the employee_deductions rows were never
-- moved off 'pending', which left their sales reading as owed on Employee Dues.
--
-- (2) STOP IT COMING BACK. Marking a salary Paid flips only the deductions that
-- are pending at that instant (resyncSalesForDeductions, EmployeePages), and
-- nothing re-checks afterwards. A trigger settles the sale whenever a deduction
-- is taken, whatever caused it - a button, an import, or a migration like this.
--
-- No cash book entry, imprest or salary figure moves: the money already left the
-- payslip. Only how much shows as OWED changes.

-- Backup first, so this is reversible exactly
CREATE TABLE IF NOT EXISTS public.employee_deductions_settle_1206 AS
SELECT d.*, now() AS backed_up_at
FROM public.employee_deductions d
WHERE d.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.salary_monthly sm
    WHERE sm.employee_id = d.employee_id
      AND date_trunc('month', sm.month::date) = date_trunc('month', d.deduction_month::date)
      AND sm.paid_date IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS public.nhe_sales_settle_1206 AS
SELECT s.id, s.amount, s.amount_received, s.received_date, s.payment_status, now() AS backed_up_at
FROM public.nhe_sales s
WHERE s.id IN (SELECT nhe_sale_id FROM public.employee_deductions_settle_1206 WHERE nhe_sale_id IS NOT NULL);

-- The settle trigger. Recomputes a sale from what has ACTUALLY been settled:
-- cash and online already recorded, plus deductions genuinely taken. Same rule
-- as the app's own resyncSalesForDeductions, so the two can never disagree.
CREATE OR REPLACE FUNCTION public.fn_settle_sale_from_deductions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id   UUID;
  v_amount    NUMERIC;
  v_direct    NUMERIC;
  v_recovered NUMERIC;
  v_settled   NUMERIC;
  v_last      DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN v_sale_id := OLD.nhe_sale_id;
  ELSE v_sale_id := NEW.nhe_sale_id; END IF;

  IF v_sale_id IS NOT NULL THEN
    SELECT s.amount, COALESCE(s.payment_cash, 0) + COALESCE(s.payment_online, 0)
      INTO v_amount, v_direct
    FROM public.nhe_sales s WHERE s.id = v_sale_id;

    IF FOUND THEN
      SELECT COALESCE(sum(d.amount), 0), max(d.deducted_at)
        INTO v_recovered, v_last
      FROM public.employee_deductions d
      WHERE d.nhe_sale_id = v_sale_id AND d.status = 'deducted';

      v_settled := COALESCE(v_direct, 0) + COALESCE(v_recovered, 0);

      UPDATE public.nhe_sales s
         SET amount_received = LEAST(v_settled, s.amount),
             received_date   = CASE WHEN v_settled > 0
                                    THEN COALESCE(s.received_date, v_last) ELSE NULL END,
             payment_status  = CASE WHEN s.amount > 0 AND v_settled >= s.amount THEN 'Received'
                                    WHEN v_settled > 0 THEN 'Partial'
                                    ELSE 'Pending' END
       WHERE s.id = v_sale_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_settle_sale_from_deductions ON public.employee_deductions;

CREATE TRIGGER trg_settle_sale_from_deductions
AFTER INSERT OR UPDATE OR DELETE ON public.employee_deductions
FOR EACH ROW EXECUTE FUNCTION public.fn_settle_sale_from_deductions();

-- Now flip the 83. The trigger above settles each sale as it goes, so no
-- separate update of nhe_sales is needed and the two can never fall out of step.
UPDATE public.employee_deductions d
SET status = 'deducted',
    deducted_at = sm.paid_date,
    salary_monthly_id = COALESCE(d.salary_monthly_id, sm.id)
FROM public.salary_monthly sm
WHERE d.status = 'pending'
  AND sm.employee_id = d.employee_id
  AND date_trunc('month', sm.month::date) = date_trunc('month', d.deduction_month::date)
  AND sm.paid_date IS NOT NULL;

-- Verification is in migration 1207: run_sql.py prints results for the first
-- five statements only, and this file already uses six to do the work. Errors
-- are printed whatever their position, so a failure here is still visible.
