-- What is left from the Daily Summary work, and two data findings that came
-- out of it. INSERT only; guarded by title so re-running never resurrects a
-- finished item.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Daily Summary: hatching egg stock grade-wise, flock-wise still to add',
   'OPEN - mine to build. The bank balance, imprest balances and Need to Receive blocks shipped on 21/09/2026, all rebuilt as at the chosen date. Egg stock did not, for a real reason rather than lack of time: wastage is recorded as a SINGLE he figure (daily_records.wastage_he, migration 143) and is NOT split by grade, so a per-grade closing stock cannot simply subtract it. Reports - Egg Stock already computes per-flock per-grade stock properly, handling opening stock, grading, per-grade dispatch from the he_dispatch_lines, NHE sales and wastage. The right build is to lift that calculation into a shared helper both pages call, NOT to re-derive it in the summary - two screens disagreeing about how many eggs are in the cold room would be worse than not showing it. That is a careful refactor of a 754-line working report, which is why it was not rushed into the same commit.',
   'Accounts', 'normal'),
  (
   'Only 61 of 1,565 cash book entries are assigned to an imprest account',
   'WAITING ON YOU - data, not code. Measured 21/09/2026. cash_accounts and cash_book.cash_account_id exist (migration 1150) and 9 cash accounts are active, but only 61 cash book rows out of 1,565 carry a cash_account_id. The other 1,504 are cash movements attributed to no box at all. So any imprest balance - on the Imprest Ledger, on Cash Accounts, and now on the Daily Summary block - reflects only those 61 rows and reads far lower than the real cash position. Nothing is wrong with the calculation; the attribution simply has not been done. DECISION NEEDED: whether older cash book rows should be assigned to imprest accounts, and if so on what rule. Nothing will be written to a live row until you say.',
   'Accounts', 'normal'),
  (
   'HE dispatch payment status looks unmaintained - 200 rows never marked received',
   'WAITING ON YOU - bookkeeping, not a bug. Measured 21/09/2026: of 237 HE dispatches, only 37 have ever been marked Received; 198 are Pending and 2 Partial. Summed as owed that is about Rs 35 crore, which is almost certainly not real money outstanding - it reads as "never marked" rather than "not paid". This matters now because Need to Receive appears on the Daily Summary: the NHE and HE figures are shown SEPARATELY there, deliberately, so this cannot hide inside one total. By contrast NHE looks maintained - 526 of 603 marked Received, 77 outstanding worth Rs 48,555. NOT INTERPRETED FURTHER and nothing changed: whether those dispatches were paid is a question for the books, not something to infer.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT priority, left(title, 60) AS title, status
FROM public.tasks
WHERE task_type = 'development'
  AND (title LIKE 'Daily Summary: hatching egg%' OR title LIKE 'Only 61 of 1,565%'
       OR title LIKE 'HE dispatch payment status%')
ORDER BY title;
