-- Outstanding after the payslip fix of 11/09/2026 (migration 1232 plus the
-- PayslipGeneratorPage change). The generator now reads the salary register, but
-- the payslips SAVED before it was fixed still hold the figures it printed at
-- the time, and those were PF on gross. Nothing was altered retroactively - the
-- owner decides whether they are corrected or left as a record of what was
-- issued. Recorded so it does not live only in a chat transcript.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Payslips saved before 11/09/2026 hold PF on gross, not on basic',
   'OPEN - WAITING ON YOUR DECISION. '
   || 'WHAT IS FIXED: the Payslip Generator now reads the salary register instead of working the '
   || 'figures out again. It was filling its Basic box with the salary row earned_salary, which is '
   || 'TOTAL EARNING (basic plus HRA plus allowance plus extra days), then taking 12 percent of that '
   || '- so PF printed on gross, roughly double. It also never applied the 15,000 restricted-PF cap, '
   || 'counted HRA twice in Gross Earnings, and took ESI and PT off the same inflated figure. '
   || 'Basic, HRA, Allowance, Extra Days Pay, PF, ESI, PT, TDS, Advance and Other Deduction now come '
   || 'straight off the salary row with Auto switched off. '
   || 'WHAT IS STILL WRONG: 10 payslips were SAVED before that fix and still carry what was printed '
   || 'at the time. Their stored pf_employee, esi_employee, pt, gross_earnings, net_salary and '
   || 'pf_employer are the old inflated figures. They were deliberately NOT rewritten - a payslip is '
   || 'a record of what was handed over, and silently changing one would hide that an employee was '
   || 'shown a deduction larger than the one actually taken. '
   || 'NO SALARY RECORD IS AFFECTED. salary_monthly was never touched and the money actually deducted '
   || 'was always the register figure, so PF returns, the Salary Register, Salary Abstract, Statutory '
   || 'Filing and the employee dues are all correct and always were. This is the printed slip only. '
   || 'WAITING ON YOU: say the word and I will list all 10 against their register rows - which are '
   || 'wrong and by how much - so you can decide per slip whether to reissue it. Any slip reopened in '
   || 'Payslip Generator now prints the register figures, so reissuing is just open and save. '
   || 'The other question worth settling at the same time: whether an employee was ever GIVEN one of '
   || 'these 10. If none left the office there is nothing to correct with anybody, only rows to tidy.',
   'HR', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

SELECT title, priority, team, status
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Payslips saved before%';

SELECT count(*)::int AS open_development_tasks
FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
