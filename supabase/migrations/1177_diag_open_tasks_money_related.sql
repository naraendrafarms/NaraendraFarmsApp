-- Migration 1177: read-only. The open tasks that bear on sales money -- cash,
-- imprests, receipts and receivables -- listed in short slices.
--
-- run_sql.py truncates each printed result at 600 characters, so 1176's list of
-- 37 open tasks was cut off mid-sentence. Titles are shortened and split across
-- statements here so nothing is hidden.
--
-- Nothing is written.

-- [1] Imprest and cash-book tasks.
SELECT string_agg(left(title, 58) || ' [' || COALESCE(priority,'-') || ']', ' | ' ORDER BY title) AS imprest_cash_tasks
FROM public.tasks
WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
  AND (title ILIKE '%imprest%' OR title ILIKE '%cash%');

-- [2] Sale, receipt and payment tasks.
SELECT string_agg(left(title, 58) || ' [' || COALESCE(priority,'-') || ']', ' | ' ORDER BY title) AS sale_payment_tasks
FROM public.tasks
WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
  AND (title ILIKE '%sale%' OR title ILIKE '%payment%' OR title ILIKE '%receiv%'
       OR title ILIKE '%invoice%' OR title ILIKE '%ledger%')
  AND title NOT ILIKE '%imprest%' AND title NOT ILIKE '%cash%';

-- [3] Expense tasks.
SELECT string_agg(left(title, 58) || ' [' || COALESCE(priority,'-') || ']', ' | ' ORDER BY title) AS expense_tasks
FROM public.tasks
WHERE task_type='development' AND COALESCE(status,'pending') <> 'done'
  AND title ILIKE '%expense%';

-- [4] The shape of the whole open list, so the money ones can be seen in
-- proportion to everything else.
SELECT count(*)::int AS open_total,
       count(*) FILTER (WHERE priority='high')::int AS high,
       count(*) FILTER (WHERE team='Accounts')::int AS accounts_team,
       count(*) FILTER (WHERE priority='high' AND team='Accounts')::int AS high_accounts
FROM public.tasks
WHERE task_type='development' AND COALESCE(status,'pending') <> 'done';

-- [5] The audit task flagged in 1176, in full -- it is the one that decides
-- whether "how many vouchers are pending" can be trusted at all.
SELECT left(description, 520) AS nhe_missing_from_cash_book
FROM public.tasks
WHERE task_type='development' AND title ILIKE '%NHE sales missing from cash_book%'
LIMIT 1;
