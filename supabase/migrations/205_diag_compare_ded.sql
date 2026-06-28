-- Migration 205: read-only. Compare the two deduction sources per employee so the user
-- can see which is correct and where the 0.5 paise comes from.

-- A. Per-employee: 'other' advances total vs employee_deductions total, with the difference
SELECT 'A_compare' AS chk, e.name,
  COALESCE(adv.total,0)  AS other_advances,
  COALESCE(ded.total,0)  AS emp_deductions,
  COALESCE(ded.total,0) - COALESCE(adv.total,0) AS difference
FROM public.employees e
LEFT JOIN (
  SELECT employee_id, SUM(amount) AS total FROM public.employee_advances
  WHERE advance_type='other' GROUP BY employee_id) adv ON adv.employee_id = e.id
LEFT JOIN (
  SELECT employee_id, SUM(amount) AS total FROM public.employee_deductions
  WHERE status='pending' GROUP BY employee_id) ded ON ded.employee_id = e.id
WHERE COALESCE(adv.total,0) <> 0 OR COALESCE(ded.total,0) <> 0
ORDER BY difference DESC, e.name;

-- B. Rows with paise (non-whole amounts) — the source of the 0.5
SELECT 'B_paise_adv' AS chk, e.name, a.amount, a.advance_type, a.salary_month
FROM public.employee_advances a JOIN public.employees e ON e.id=a.employee_id
WHERE a.amount <> ROUND(a.amount) ORDER BY a.amount;

SELECT 'C_paise_ded' AS chk, e.name, d.amount, d.description
FROM public.employee_deductions d JOIN public.employees e ON e.id=d.employee_id
WHERE d.amount <> ROUND(d.amount) ORDER BY d.amount;
