-- Two findings from comparing the filed August 2026 ESIC and EPFO returns with
-- the app. INSERT only into tasks; guarded by title so re-running never
-- resurrects a finished item. No live row is touched.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Employer ESI is rounded per employee, ESIC rounds on the total - Rs 12 apart',
   'WAITING ON YOU - a decision, not a bug. Found 21/09/2026 by comparing the filed August ESIC contribution history with salary_monthly. Employee side agrees to the rupee: app Rs 2,218, filed Rs 2,218, on an identical wage base of Rs 2,94,009 across the same 23 people. Employer side does not: the app books Rs 9,568, the ESIC statement shows Rs 9,556, a gap of Rs 12. Neither is arithmetically wrong - computeSalaryForEmp does Math.ceil(basicEarned * 0.0325) for EACH employee, so 23 separate round-ups; ESIC took 3.25 percent of the total wage (2,94,009 x 3.25 percent = 9,555.29) and rounded that once. The app will therefore always read a few rupees above the challan, every month, and the gap grows with headcount. DECISION NEEDED: leave it as is and accept the books sitting slightly above the challan, or change the employer ESI to be computed on the monthly total so the two reconcile exactly. Nothing changed - the formula is untouched until you say which.',
   'HR', 'normal'),
  (
   'One August salary row has basic_salary NULL rather than 0',
   'OPEN - mine to tidy, low risk. Found 21/09/2026. The employee who did no work at all in August (0 days, filed to both ESIC and EPFO as zero, ESIC reason "No Work") has basic_salary stored as NULL on the August salary_monthly row, not 0. The app handles it correctly by accident: StatutoryFilingPage reads Number(r.basic_salary ?? 0), so it becomes 0 and files as zero, matching the return exactly. But NULL and 0 are not the same to SQL - a diagnostic written the same day computed LEAST(basic_salary, 15000) and Postgres SKIPPED the NULL and returned 15,000, making the PF wage base look Rs 15,000 higher than what was actually filed. That was a false alarm about MY query, not about the app, but a NULL basic on a paid-month salary row is a trap that will catch the next report too. Worth setting to 0, with a backup of the row taken in the same migration first, and worth checking whether other months carry the same NULL. NOT DONE YET - no live row has been written.',
   'HR', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT priority, left(title, 60) AS title, status
FROM public.tasks
WHERE task_type = 'development'
  AND (title LIKE 'Employer ESI is rounded%' OR title LIKE 'One August salary row%')
ORDER BY title;
