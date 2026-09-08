-- Verification for migration 1206. A throwaway first statement because the
-- runner's first request sometimes returns nothing it will print.
SELECT 1 AS warmup;

-- 1. Nothing should remain pending against a salary that has already been paid
SELECT count(*)::int AS still_pending_on_a_paid_salary,
       (SELECT count(*)::int FROM public.employee_deductions_settle_1206) AS rows_backed_up,
       (SELECT round(sum(amount))::numeric FROM public.employee_deductions_settle_1206) AS amount_corrected
FROM public.employee_deductions d
JOIN public.salary_monthly sm
  ON sm.employee_id = d.employee_id
 AND date_trunc('month', sm.month::date) = date_trunc('month', d.deduction_month::date)
WHERE d.status = 'pending' AND sm.paid_date IS NOT NULL;

-- 2. What the Employee Dues panel reads now, against what it read before
SELECT count(*)::int AS employee_sales,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received,
       count(*) FILTER (WHERE payment_status = 'Partial')::int AS partial,
       count(*) FILTER (WHERE COALESCE(payment_status,'Pending') = 'Pending')::int AS pending,
       round(sum(amount - COALESCE(amount_received,0)))::numeric AS still_shown_as_due
FROM public.nhe_sales WHERE is_employee_sale;

-- 3. The trigger is present and armed
SELECT count(*)::int AS settle_trigger_present,
       COALESCE(string_agg(tgname, ', '), 'NONE') AS names
FROM pg_trigger
WHERE tgrelid = 'public.employee_deductions'::regclass
  AND NOT tgisinternal AND tgname = 'trg_settle_sale_from_deductions';

-- 4. Sales that were corrected, before and after, from the backup
SELECT count(*)::int AS sales_touched,
       round(sum(b.amount - COALESCE(b.amount_received,0)))::numeric AS was_shown_as_due,
       round(sum(s.amount - COALESCE(s.amount_received,0)))::numeric AS now_shown_as_due,
       count(*) FILTER (WHERE s.payment_status = 'Received')::int AS now_received,
       count(*) FILTER (WHERE s.payment_status = 'Partial')::int  AS now_partial
FROM public.nhe_sales_settle_1206 b
JOIN public.nhe_sales s ON s.id = b.id;
