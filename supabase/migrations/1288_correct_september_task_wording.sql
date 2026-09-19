-- The September salary rows are NOT a payroll waiting to go out. The owner
-- says Calculate Salaries was pressed by mistake while September is still
-- running and attendance is still being entered daily, so the figures are
-- built from a part-finished month. Two tasks I seeded in 1281 describe them
-- as real outstanding pay, which is now wrong and has to be corrected rather
-- than left to mislead.
--
-- Titles are left exactly as they are so the NOT EXISTS guard in 1281 still
-- matches and can never resurrect a duplicate. Only the descriptions change.
-- UPDATEs existing rows, so both are copied to a backup table FIRST.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1288 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title IN (
    'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding',
    '122 staff have no bank account and no shared account set - Rs 14,34,405 of September has no route');

UPDATE public.tasks
SET description = 'CORRECTED 19/09/2026 - THIS IS NOT A PAYROLL WAITING TO GO OUT. Calculate Salaries was pressed by mistake while September is still running and attendance is still being entered daily, so the 268 rows holding Rs 40,28,381 are built from a part-finished month and are not a real salary run. Measured: all 268 have is_paid false and paid_date NULL, so no money moved and nothing is owed on the strength of these rows. WHAT THEY DO AFFECT: Cost Analysis reads salary_monthly filtered only by month, with no is_paid filter, and so does the financial-year total, and Reports read v_salary_abstract which derives from the same table - so a part-month figure is showing as September salary cost today. For scale, September computed at Rs 40,28,381 against August Rs 33,51,549 for the same 268 people, about 20 per cent higher, which is what you would expect when absences for the rest of the month have not been marked yet - not measured, only noted. WHAT THEY DO NOT AFFECT: attendance entry is not blocked, because the month lock is on paid_date and every one is NULL. AND RECALCULATING FIXES THEM: the bulk Calculate upserts on employee and month, so running it properly at month end replaces these rows rather than adding to them. DECISION NEEDED: leave them to be overwritten at month end, or delete them now with a backup so the cost reports stop showing a phantom September. Nothing will be written either way until you say.',
    priority = 'normal'
WHERE task_type = 'development'
  AND title = 'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding';

UPDATE public.tasks
SET description = 'WAITING ON YOU. Measured 19/09/2026 (migration 1280). All 268 employees are payment_mode = own_account and 122 of them have no account_no and no IFSC. Salary here is never paid in cash - it goes to the employee''s own account or to another employee''s account - so the right route for these 122 is shared_account with shared_with_emp_id naming whose account to credit. Until that is set they fall out of the payment file silently: exportKotakCMS skips a row whose account number is blank, so 146 staff route to the bank file and 122 route nowhere, with nothing on screen to say so. NOTE ON THE AMOUNTS: the rupee figures that came with this - Rs 25,93,976 routed and Rs 14,34,405 not - are taken from September salary rows that were calculated by mistake mid-month and will change when September is calculated properly at month end. THE 122 PEOPLE AND THE HOLE ITSELF ARE REAL AND DO NOT DEPEND ON THOSE AMOUNTS. ALREADY BUILT: the Employee form offers Own Bank Account / Shared (Other Employee Account) / Cash, the CMS export swaps in the holder''s account and IFSC for a shared employee, salary_monthly.override_account_emp_id allows a one-month redirect, and as of 19/09/2026 Bulk Salary names everyone who has no usable account in an amber panel and on a NOT PAYABLE sheet in the workbook. WAITING ON YOU: for each of the 122, either their own account number or which employee''s account to credit. ALSO FOUND: 1 employee has shared_with_emp_id filled in but is still on own_account, so that holder''s account is being ignored. No live row will be written until you say so.'
WHERE task_type = 'development'
  AND title = '122 staff have no bank account and no shared account set - Rs 14,34,405 of September has no route';

SELECT (SELECT count(*)::int FROM public.tasks_backup_1288) AS rows_backed_up,
       count(*) FILTER (WHERE description LIKE 'CORRECTED 19/09/2026%')::int AS september_task_corrected,
       count(*) FILTER (WHERE description LIKE '%NOTE ON THE AMOUNTS%')::int AS routing_task_corrected,
       count(*)::int AS tasks_matched
FROM public.tasks
WHERE task_type = 'development'
  AND title IN (
    'September 2026 salary is computed but not paid - Rs 40,28,381 outstanding',
    '122 staff have no bank account and no shared account set - Rs 14,34,405 of September has no route');
