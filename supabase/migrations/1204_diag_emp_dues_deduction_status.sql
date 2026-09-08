-- Read-only. The dues the panel shows equal what is really owed once deductions
-- already taken are counted, so nothing is double-counted TODAY. The remaining
-- question is why those amounts are still owed at all: is the salary unpaid, is
-- the deduction sitting at 'pending', or was the sale never linked to one.
SELECT 1 AS warmup;

-- 1. Every employee sale still showing as owed, and what stands behind it
SELECT CASE
         WHEN d.n IS NULL THEN 'no deduction row at all'
         WHEN d.pending > 0 AND d.taken = 0 THEN 'deduction pending - salary not marked Paid'
         WHEN d.pending > 0 AND d.taken > 0 THEN 'part taken, part still pending'
         ELSE 'deduction taken but sale still short'
       END AS why,
       count(*)::int AS sales,
       round(sum(s.amount - COALESCE(s.amount_received,0)))::numeric AS amount
FROM public.nhe_sales s
LEFT JOIN LATERAL (
  SELECT count(*)::int AS n,
         count(*) FILTER (WHERE x.status = 'pending')::int  AS pending,
         count(*) FILTER (WHERE x.status = 'deducted')::int AS taken
  FROM public.employee_deductions x WHERE x.nhe_sale_id = s.id
) d ON TRUE
WHERE s.is_employee_sale AND s.amount - COALESCE(s.amount_received,0) > 0.005
GROUP BY 1 ORDER BY 3 DESC;

-- 2. Gas sales specifically, since that is the one asked about
SELECT COALESCE(e.name,'-') AS employee, s.sale_date::text, s.amount::numeric,
       COALESCE(s.amount_received,0)::numeric AS received,
       COALESCE(s.payment_status,'Pending') AS status,
       COALESCE((SELECT string_agg(x.status || ' ' || x.amount::text, ', ')
                 FROM public.employee_deductions x WHERE x.nhe_sale_id = s.id),
                '(no deduction row)') AS deductions
FROM public.nhe_sales s
LEFT JOIN public.employees e ON e.id = s.employee_id
WHERE s.sale_type = 'gas' AND s.is_employee_sale
  AND s.amount - COALESCE(s.amount_received,0) > 0.005
ORDER BY s.sale_date DESC LIMIT 15;

-- 3. Deduction rows by status and month, so 'salary not yet marked Paid' can be
--    told apart from 'salary paid but the app was never told'
SELECT x.status, count(*)::int AS rows, round(sum(x.amount))::numeric AS amount,
       COALESCE(min(x.deduction_month)::text,'-') || ' -> ' || COALESCE(max(x.deduction_month)::text,'-') AS months
FROM public.employee_deductions x GROUP BY x.status ORDER BY 2 DESC;

-- 4. Salary records those pending deductions are waiting on
SELECT CASE WHEN sm.employee_id IS NULL THEN 'no salary row for that month'
            WHEN sm.paid_date IS NULL THEN 'salary row exists but NOT marked paid'
            ELSE 'salary marked paid on ' || sm.paid_date::text END AS salary_state,
       count(DISTINCT x.id)::int AS pending_deductions,
       round(sum(x.amount))::numeric AS amount
FROM public.employee_deductions x
LEFT JOIN public.salary_monthly sm
       ON sm.employee_id = x.employee_id
      AND date_trunc('month', sm.month::date) = date_trunc('month', x.deduction_month::date)
WHERE x.status = 'pending'
GROUP BY 1 ORDER BY 2 DESC;
