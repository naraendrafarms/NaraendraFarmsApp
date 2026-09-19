-- The leave REGISTER shipped this session; the task still describes it as an
-- open choice between three options. Corrected rather than left to mislead.
-- The one decision that remains is a different and narrower one: whether a day
-- marked paid leave should count as a PAID day in the salary calculation.
-- UPDATEs a row, so it is backed up first.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1295 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title LIKE 'Leave: there is no leave policy%';

UPDATE public.tasks
SET description = 'REGISTER SHIPPED 19/09/2026. Mark a day A or H on Daily Attendance and a reason box and a Paid tick appear on that row (only for A and H - they mean nothing on a worked day). Attendance & Salary - Date Range now shows Away - paid and Away - unpaid with the reasons, totalled and in the Export. Columns added in migration 1294 and verified before the code: both present, 20,674 attendance rows unchanged, 0 marked paid, 4,162 absent days on record. NO SALARY CHANGED - absence_paid defaults to false, which is how an A has always behaved, and paid days are still Present + OT + half a Half day. NO BALANCE WAS BUILT, DELIBERATELY: a balance needs an entitlement to count down from, and the owner confirmed on 19/09/2026 that the company has no written leave rule, so a ledger would mean the app inventing the company policy. ONE DECISION STILL OPEN, and it is the only thing standing between this register and pay: should a day ticked PAID count as a PAID day in the salary run? Today it does not - a paid-leave day is still an absent day for pay, exactly as before the tick existed - so a man given paid leave is recorded as having been given it but is not actually paid for it. Say yes and the salary calculation will count those days as worked; say no and the tick stays a record only. WAITING ON YOU. And if the leave rules are ever written down - how many days a year, which types, whether they carry forward - the full entitlement ledger can be built on top of this register.',
    priority = 'high'
WHERE task_type = 'development'
  AND title LIKE 'Leave: there is no leave policy%';

SELECT (SELECT count(*)::int FROM public.tasks_backup_1295) AS rows_backed_up,
       count(*) FILTER (WHERE description LIKE 'REGISTER SHIPPED%')::int AS corrected,
       count(*)::int AS task_found
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Leave: there is no leave policy%';
