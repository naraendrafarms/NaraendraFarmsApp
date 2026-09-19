-- Seeds the outstanding items measured in 1278/1279/1280 into public.tasks as
-- development tasks, so they are not left sitting in the chat. INSERT only --
-- no existing row is updated or deleted, so no backup table is needed.
-- Guarded by NOT EXISTS on title so re-running never resurrects a done item.
-- Cash is not used for salary here: employees are paid into their own account
-- or into another employee''s account, so the route for the 122 without an
-- account is shared_account, not cash.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   '122 staff have no bank account and no shared account set - Rs 14,34,405 of September has no route',
   'WAITING ON YOU. Measured 19/09/2026 (migration 1280). All 268 employees are payment_mode = own_account and 122 of them have no account_no and no IFSC. Salary here is never paid in cash - it goes to the employee''s own account or to another employee''s account - so the right route for these 122 is shared_account with shared_with_emp_id naming whose account to credit. Until that is set they fall out of the payment file silently: exportKotakCMS skips a row whose account number is blank, so for September 146 staff route to the bank file (Rs 25,93,976) and 122 route nowhere (Rs 14,34,405), with nothing on screen to say so. ALREADY BUILT AND SITTING IDLE: the Employee form already offers Own Bank Account / Shared (Other Employee Account) / Cash, the CMS export already swaps in the holder''s account and IFSC for a shared employee, and salary_monthly.override_account_emp_id already allows a one-month-only redirect. WAITING ON YOU: for each of the 122, either their own account number or which employee''s account to credit. ALSO FOUND: 1 employee has shared_with_emp_id filled in but is still on own_account, so that holder''s account is being ignored - say if it should be switched. No live row will be written until you say so.',
   'HR', 'high'),
  (
   'Payment file gives no warning when an employee has no usable account',
   'OPEN - mine to build, needs your go-ahead. exportKotakCMS drops a row whose account number is blank (if (!acct) continue) and says nothing. That is how 122 people and Rs 14,34,405 can vanish from a September payment file that still reports a healthy bank total. FIX: count the unroutable rows before writing the file, show them on screen with names and amounts, and put them on their own sheet in the workbook so the file itself records who was left out. Small change, entirely in src/pages/employees/EmployeePages.tsx, no migration needed.',
   'Accounts', 'high'),
  (
   'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding',
   'WAITING ON YOU. Measured 19/09/2026 (migrations 1278, 1279). All 268 September rows have is_paid = false and paid_date NULL. Rs 40,28,381 net. Every earlier month is settled: August 26 rows unpaid but all Rs 0, July 19 unpaid all Rs 0, June 12 unpaid all Rs 0. Partly blocked by the item above - 122 of the 268 have no route out of the app today.',
   'HR', 'high'),
  (
   '230 of 268 employees have no joining date recorded',
   'WAITING ON YOU - data entry. Measured 19/09/2026 (migration 1279). Only 38 employees have a joining_date at all, so for 230 the app cannot tell whether a day marked in attendance is valid, cannot pro-rate a part month, and cannot compute gratuity or notice. Of the 38 that do have one, 25 have attendance before it - 333 days - and every one of those days falls inside the joining month with none starting in an earlier month, which is attendance marked from the 1st, not a rejoiner. days_worked shows the salary was built from the real days, so nothing was overpaid.',
   'HR', 'high'),
  (
   'An employee who leaves and rejoins cannot be recorded at all',
   'NOT BUILT. employees has a single joining_date and a single leaving_date (migration 001) and there is no employment-history table anywhere in supabase/migrations. Measured 19/09/2026: 0 of 268 employees have a leaving_date set. So a man who leaves for a month or more and rejoins has one date, and whichever way it is filled one of the two spells is wrong - which also silently breaks any attendance or pro-rata check built on joining_date. NOTE ON EVIDENCE: attendance_daily only covers 01/07/2026 to 17/09/2026, three months, so a gap test over that window proves nothing either way about how often this happens - it was not measured and must not be claimed. PROPOSED: an employment_spells table (employee, joined, left, reason) with the employees columns kept as the current spell so every existing screen keeps working, and attendance and pro-rata read the spells.',
   'HR', 'normal'),
  (
   'Cash salary payment does not attribute to an imprest',
   'OPEN but LOW - salary is not paid in cash here, so this is a latent gap, not a live one. cash_accounts exists (migration 1150: ho_imprest / mandal_imprest / site_petty / person) and cash_book.cash_account_id records which cash box the money moved through. Ten screens set it, including the employee advance form in the same module, which refuses to save a cash advance without a cash account. The salary Cash Payments flow does not: grep for cash_account_id in src/pages/employees/EmployeePages.tsx returns nothing, so were a salary ever marked paid in cash it would land in cash_book with cash_account_id NULL and the Imprest Ledger would be short by that amount. Worth fixing only if cash salary is ever used.',
   'Accounts', 'low'),
  (
   'Form 16 is the one statutory return the app does not produce',
   'OPEN - mine to build, needs your go-ahead. Verified 19/09/2026 in Employees - Statutory Compliance Center: PF ECR text file in EPFO format with the Rs 15,000 ceiling and Restrict PF, ESIC csv, PT csv, a remittance tracker and UAN/IP warnings are all there and working. Form 16 Part B is the remaining gap. Not urgent until the financial year closes.',
   'HR', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT priority, title, team, status
FROM public.tasks
WHERE task_type = 'development'
  AND title IN (
    '122 staff have no bank account and no shared account set - Rs 14,34,405 of September has no route',
    'Payment file gives no warning when an employee has no usable account',
    'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding',
    '230 of 268 employees have no joining date recorded',
    'An employee who leaves and rejoins cannot be recorded at all',
    'Cash salary payment does not attribute to an imprest',
    'Form 16 is the one statutory return the app does not produce')
ORDER BY priority, title;
