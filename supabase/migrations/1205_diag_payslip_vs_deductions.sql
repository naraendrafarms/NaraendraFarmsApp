-- Read-only. The payslip itself settles it. salary_monthly.other_deduction is the
-- flock-deduction total that was actually taken when the salary was calculated,
-- so comparing it with what employee_deductions has flipped says plainly whether
-- the 83 still-pending rows were in that payslip or not.
SELECT 1 AS warmup;

-- 1. Paid salaries, deduction taken on the payslip against what the app flipped
SELECT CASE
         WHEN COALESCE(sm.other_deduction,0) = 0 AND d.pending_amt > 0
           THEN 'payslip deducted NOTHING - these were not in it'
         WHEN COALESCE(sm.other_deduction,0) + 0.5 >= d.taken_amt + d.pending_amt
           THEN 'payslip covered taken AND pending - the pending ones WERE deducted'
         WHEN COALESCE(sm.other_deduction,0) + 0.5 >= d.taken_amt
           THEN 'payslip covered only what is already flipped'
         ELSE 'payslip is short of even the flipped ones'
       END AS verdict,
       count(*)::int AS employee_months,
       round(sum(d.pending_amt))::numeric AS pending_amount,
       round(sum(COALESCE(sm.other_deduction,0)))::numeric AS payslip_deducted
FROM public.salary_monthly sm
JOIN LATERAL (
  SELECT COALESCE(sum(x.amount) FILTER (WHERE x.status='pending'),0)  AS pending_amt,
         COALESCE(sum(x.amount) FILTER (WHERE x.status='deducted'),0) AS taken_amt
  FROM public.employee_deductions x
  WHERE x.employee_id = sm.employee_id
    AND date_trunc('month', x.deduction_month::date) = date_trunc('month', sm.month::date)
) d ON d.pending_amt > 0
WHERE sm.paid_date IS NOT NULL
GROUP BY 1 ORDER BY 3 DESC;

-- 2. The same, employee by employee, so the actual rows can be looked at
SELECT COALESCE(e.name,'-') AS employee, sm.month::text AS month,
       sm.paid_date::text AS paid_on,
       round(COALESCE(sm.other_deduction,0))::numeric AS payslip_deducted,
       round(d.taken_amt)::numeric   AS already_flipped,
       round(d.pending_amt)::numeric AS still_pending
FROM public.salary_monthly sm
LEFT JOIN public.employees e ON e.id = sm.employee_id
JOIN LATERAL (
  SELECT COALESCE(sum(x.amount) FILTER (WHERE x.status='pending'),0)  AS pending_amt,
         COALESCE(sum(x.amount) FILTER (WHERE x.status='deducted'),0) AS taken_amt
  FROM public.employee_deductions x
  WHERE x.employee_id = sm.employee_id
    AND date_trunc('month', x.deduction_month::date) = date_trunc('month', sm.month::date)
) d ON d.pending_amt > 0
WHERE sm.paid_date IS NOT NULL
ORDER BY d.pending_amt DESC LIMIT 20;

-- 3. When were those pending deductions created, against the day the salary was
--    paid? Created afterwards means they were never in that payslip.
SELECT CASE WHEN x.created_at::date > sm.paid_date THEN 'raised AFTER the salary was paid'
            ELSE 'existed before the salary was paid' END AS timing,
       count(*)::int AS deductions, round(sum(x.amount))::numeric AS amount
FROM public.employee_deductions x
JOIN public.salary_monthly sm
  ON sm.employee_id = x.employee_id
 AND date_trunc('month', sm.month::date) = date_trunc('month', x.deduction_month::date)
WHERE x.status = 'pending' AND sm.paid_date IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC;

-- 4. Does salary_monthly even carry the column, and what months are paid
SELECT count(*)::int AS paid_salaries,
       count(*) FILTER (WHERE COALESCE(other_deduction,0) > 0)::int AS with_a_flock_deduction,
       round(sum(COALESCE(other_deduction,0)))::numeric AS total_deducted_on_payslips,
       COALESCE(min(month::date)::text,'-') || ' -> ' || COALESCE(max(month::date)::text,'-') AS months
FROM public.salary_monthly WHERE paid_date IS NOT NULL;
