-- List all bank_accounts rows and how many bank_transactions each has, so
-- we know which ones are safe to delete/merge vs which have real data
-- pinned to them.
SELECT ba.id, ba.account_name, ba.bank_name, ba.account_no, ba.is_active,
       (SELECT COUNT(*) FROM public.bank_transactions bt WHERE bt.bank_account_id = ba.id) AS txn_count,
       (SELECT COUNT(*) FROM public.pending_payments pp WHERE pp.bank_account_id = ba.id) AS pp_count,
       (SELECT COUNT(*) FROM public.salary_monthly sm WHERE sm.bank_account_id = ba.id) AS salary_count
FROM public.bank_accounts ba
ORDER BY ba.account_name;
