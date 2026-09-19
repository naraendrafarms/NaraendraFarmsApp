-- READ ONLY. Cash salary payment already exists in the app (employees
-- .payment_mode = own_account / shared_account / cash, migration 166, with a
-- Cash Payments table on the Salary Payment screen). The question is whether
-- it is actually SET for people who have no bank account.
--
-- The trap: exportKotakCMS skips a row when the account number is blank
-- ("if (!acct) continue"). So someone with no account who is still on
-- own_account is dropped from the bank file AND is not in the cash sheet -
-- he simply does not get paid, with nothing on screen to say so.
-- Measuring how many such people there are in the unpaid September run.
-- No writes.

SELECT COALESCE(payment_mode,'(null)') AS payment_mode,
       count(*)::int AS employees,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(account_no),''),NULL) IS NULL)::int AS no_account_no,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(ifsc),''),NULL) IS NULL)::int       AS no_ifsc,
       count(*) FILTER (WHERE shared_with_emp_id IS NOT NULL)::int                      AS has_shared_holder
FROM public.employees
GROUP BY COALESCE(payment_mode,'(null)') ORDER BY 2 DESC;

WITH sept AS (
  SELECT s.id, s.net_salary, s.override_account_emp_id,
         e.emp_id, e.name, COALESCE(e.payment_mode,'own_account') AS pm,
         NULLIF(btrim(e.account_no),'')  AS own_acct,
         e.shared_with_emp_id,
         NULLIF(btrim(h.account_no),'')  AS shared_acct,
         NULLIF(btrim(o.account_no),'')  AS override_acct
  FROM public.salary_monthly s
  JOIN public.employees e ON e.id = s.employee_id
  LEFT JOIN public.employees h ON h.id = e.shared_with_emp_id
  LEFT JOIN public.employees o ON o.id = s.override_account_emp_id
  WHERE s.month = date '2026-09-01' AND COALESCE(s.net_salary,0) > 0
)
SELECT CASE
         WHEN override_account_emp_id IS NOT NULL AND override_acct IS NOT NULL THEN 'bank - override account'
         WHEN override_account_emp_id IS NOT NULL AND override_acct IS NULL     THEN 'DROPPED - override holder has no account'
         WHEN pm = 'cash'                                                        THEN 'cash - will show in Cash Payments'
         WHEN pm = 'shared_account' AND shared_acct IS NOT NULL                  THEN 'bank - shared account'
         WHEN pm = 'shared_account'                                              THEN 'DROPPED - shared but holder has no account'
         WHEN own_acct IS NOT NULL                                               THEN 'bank - own account'
         ELSE 'DROPPED - own_account but no account number'
       END AS routing,
       count(*)::int AS employees,
       round(sum(net_salary))::int AS amount
FROM sept GROUP BY 1 ORDER BY 3 DESC;

WITH sept AS (
  SELECT s.net_salary, s.override_account_emp_id,
         e.emp_id, e.name, COALESCE(e.payment_mode,'own_account') AS pm,
         NULLIF(btrim(e.account_no),'') AS own_acct,
         e.shared_with_emp_id,
         NULLIF(btrim(h.account_no),'') AS shared_acct,
         NULLIF(btrim(o.account_no),'') AS override_acct,
         f.name AS site
  FROM public.salary_monthly s
  JOIN public.employees e ON e.id = s.employee_id
  LEFT JOIN public.employees h ON h.id = e.shared_with_emp_id
  LEFT JOIN public.employees o ON o.id = s.override_account_emp_id
  LEFT JOIN public.farms f ON f.id = e.farm_id
  WHERE s.month = date '2026-09-01' AND COALESCE(s.net_salary,0) > 0
)
SELECT emp_id, name, site, pm AS payment_mode, round(net_salary)::int AS net_salary
FROM sept
WHERE (override_account_emp_id IS NOT NULL AND override_acct IS NULL)
   OR (override_account_emp_id IS NULL AND pm = 'shared_account' AND shared_acct IS NULL)
   OR (override_account_emp_id IS NULL AND pm NOT IN ('cash','shared_account') AND own_acct IS NULL)
ORDER BY net_salary DESC LIMIT 40;
