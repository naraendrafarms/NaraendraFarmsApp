-- The employer ESI rounding question is answered and shipped, so the task that
-- was waiting on it must not sit open claiming otherwise. Back the row up
-- before touching it, then mark it done, and record the new item: the rest of
-- the months are to be checked once the statements are uploaded.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1308 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Employer ESI is rounded per employee, ESIC rounds on the total - Rs 12 apart';

UPDATE public.tasks
SET status = 'done',
    description = description || ' ANSWERED AND SHIPPED 21/09/2026: you chose the total basis. The Statutory Compliance Center now computes the employer share as 3.25 percent of the month total wage rounded up once, the way ESIC does, so the payable figure matches the challan. Frontend only - no salary was recalculated, no payslip changed, no salary row was written and no migration was needed, because employer ESI feeds CTC and never net pay. The per-employee figures on salary_monthly were deliberately left alone since the salaries are already paid; they still drive CTC and the Salary Register, and the page now prints both numbers when the two bases differ.'
WHERE task_type = 'development'
  AND title = 'Employer ESI is rounded per employee, ESIC rounds on the total - Rs 12 apart'
  AND status <> 'done';

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Check the remaining months of ESIC and EPFO filings against the app',
   'WAITING ON YOU - the statements. August 2026 was checked on 21/09/2026 and came out clean: ESIC 23 IPs, wages Rs 2,94,009 and employee Rs 2,218 both exact, employer now on the ESIC basis; EPFO 25 members, wages Rs 3,24,009, employee Rs 38,883 and employer Rs 38,883 all exact, every part-month person matching on wage and gross. You said you will upload the rest of the months. SEND FOR EACH MONTH: the ESIC Contribution History and the EPFO ECR Return Statement, as they were actually filed. USEFUL BUT NOT ESSENTIAL: the ESI and PF challans, which would also let the PF admin charge (A/c 2) and EDLI (A/c 21) be checked - both 0.5 percent in the app and neither shown on the ECR statement, so August could not be verified on those two. Each month will be compared the same way, per person and on the totals, and anything that does not tie will be measured before it is explained.',
   'HR', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT status, priority, left(title, 55) AS title
FROM public.tasks
WHERE task_type = 'development'
  AND (title LIKE 'Employer ESI is rounded%' OR title LIKE 'Check the remaining months%'
       OR title LIKE 'One August salary row%')
ORDER BY title;
