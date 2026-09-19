-- Form 16 shipped this session, so its task is closed rather than left open.
-- And the leave ledger gets a task that records what was actually found,
-- because "build a leave ledger" turned out to rest on a policy that does not
-- exist here. UPDATE first backs the row up.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1293 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Form 16 is the one statutory return the app does not produce';

UPDATE public.tasks
SET status = 'done', completed_at = NOW()
WHERE task_type = 'development'
  AND title = 'Form 16 is the one statutory return the app does not produce'
  AND status <> 'done';

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Leave: there is no leave policy, so there is nothing to keep a balance against',
   'WAITING ON YOU - a decision, not data. Asked to build a leave ledger; checked first and found the ground is not there. attendance_daily holds only P / A / H / WO / OT (migration 057) - there is NO leave status at all, so today a man on approved leave is marked either A, and goes unpaid, or P, and is paid as if present. And the owner confirmed on 19/09/2026 that the company has NO separate rule for leave or for how leave is paid. A classic leave ledger - entitlement, accrual, balance, carry-forward - would therefore be INVENTING A POLICY the farm does not have, and a balance computed against a rule nobody agreed is worse than no balance at all. WHAT IS BUILDABLE WITHOUT INVENTING ANYTHING: a leave REGISTER rather than a ledger. Add a reason against an absence and a paid-or-unpaid marker, so the day is recorded as what it was, and a per-employee yearly view built from attendance that already exists - days absent, of which paid, of which unpaid. That needs two columns on attendance_daily and a screen, and it needs the owner to say whether a paid leave day should count as a PAID day in the salary calculation, because today a day is either worked or absent and there is no third case. DECISION NEEDED before anything is built: (a) the register above, (b) a full entitlement ledger, which first needs a written leave policy - how many days a year, which types, does it carry forward, or (c) leave it alone. Nothing will be built until you say.',
   'HR', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT (SELECT count(*)::int FROM public.tasks_backup_1293) AS form16_rows_backed_up,
       (SELECT count(*)::int FROM public.tasks WHERE task_type='development'
          AND title = 'Form 16 is the one statutory return the app does not produce'
          AND status = 'done') AS form16_done,
       (SELECT count(*)::int FROM public.tasks WHERE task_type='development'
          AND title LIKE 'Leave: there is no leave policy%') AS leave_task_present,
       (SELECT count(*)::int FROM public.tasks WHERE task_type='development' AND status <> 'done') AS still_open;
