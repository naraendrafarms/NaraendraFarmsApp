-- Migration 1151: record the owner's imprest decisions and what remains.
--
-- Updates the task created by 1149 rather than adding a second one, so the
-- pending list does not grow a near-duplicate. Nothing else is touched.

UPDATE public.tasks
SET description =
  'PART BUILT. DONE: cash_accounts master with the owner''s four accounts (HO Imprest, Mandal Imprest, '
  || 'Dendi Naraendra Reddy Imprest, Dendi Srinath Reddy Imprest); cash_book.cash_account_id and '
  || 'transfer_group_id; v_cash_account_balance; and the Masters -> Cash Imprest Accounts screen with a '
  || 'balance card and table per account. Opening balance and opening date are editable there by the owner. '
  || 'DECIDED BY OWNER: (a) the named people are HOLDERS, so cash moved to them is an internal transfer, not '
  || 'an expense; (b) Mandal Imprest is ONE account, not one per mandal; (c) NO DEFAULT imprest on NHE sale '
  || 'receipts -- the entry must SELECT which flock/site the cash came from, the amount, and which imprest '
  || 'received it, because the same site''s cash reaches different holders on different days and a default '
  || 'would silently mislabel it; (d) the cash book stays the single place every transaction is visible. '
  || 'NOT BACKFILLED ON PURPOSE: all 1,260 historical cash_book rows keep cash_account_id NULL. They record '
  || 'which SITE bore each cost but never which cash box held the money, so assigning them would put invented '
  || 'balances on accounts carrying real people''s names. Balances start from the opening figure instead. '
  || 'STILL TO BUILD: (1) imprest picker on the cash book entry form, beside site and flock; '
  || '(2) the Transfer button upgraded so From and To can each be an IMPREST OR A BANK ACCOUNT -- imprest to '
  || 'imprest, imprest to bank (cash deposit) and bank to imprest (cash drawn) are all impossible today because '
  || 'cash_book and bank_transactions are separate tables with nothing crossing between them; '
  || '(3) bank_transactions needs transfer_group_id so a cross-book transfer cannot be half-deleted -- the '
  || 'existing site-to-site transfer writes two loose rows and deleting one silently unbalances the book; '
  || '(4) a statement per holder: given X, spent Y, holds Z, with every line. '
  || 'WAITING ON YOU: confirm cheque and UPI rows stay OUT of imprest balances, an imprest being physical cash.',
    priority = 'high',
    team = 'Accounts'
WHERE task_type = 'development'
  AND title = 'Cash imprest accounts and internal transfers';

-- VERIFY: the task was found and updated, and the four accounts really exist.
SELECT (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development'
          AND title='Cash imprest accounts and internal transfers'
          AND description LIKE 'PART BUILT%') AS task_updated,
       (SELECT count(*)::int FROM public.cash_accounts) AS accounts,
       (SELECT count(*)::int FROM public.cash_book WHERE cash_account_id IS NOT NULL) AS rows_assigned,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='bank_transactions'
          AND column_name='transfer_group_id') AS bank_pairing_column_exists;
