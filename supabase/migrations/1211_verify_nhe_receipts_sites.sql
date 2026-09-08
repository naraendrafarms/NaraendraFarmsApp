-- Verification for 1210.
SELECT 1 AS warmup;

-- 1. Where the 17 sit now
SELECT COALESCE(fa.name,'(still no site)') AS site,
       COALESCE(a.name,'(derived)') AS imprest_now,
       count(*)::int AS rows, round(sum(cb.amount_in))::numeric AS amount
FROM public.cash_book_site_restore_1210 b
JOIN public.cash_book cb ON cb.id = b.id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
LEFT JOIN public.cash_accounts a ON a.id = cb.cash_account_id
GROUP BY 1,2 ORDER BY 3 DESC;

-- 2. Which imprest the ledger counts them in now
SELECT COALESCE(a.name,'(none)') AS imprest_in_ledger,
       count(*)::int AS rows, round(sum(COALESCE(v.amount_in,0)))::numeric AS amount
FROM public.cash_book_site_restore_1210 b
JOIN public.v_imprest_entries v ON v.cash_book_id = b.id
LEFT JOIN public.cash_accounts a ON a.id = v.cash_account_id
GROUP BY 1 ORDER BY 2 DESC;

-- 3. Anything left with no site at all
SELECT count(*)::int AS nhe_rows_still_site_less,
       round(COALESCE(sum(cb.amount_in),0))::numeric AS amount
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
WHERE cb.farm_id IS NULL;

-- 4. The imprest balances that moved
SELECT a.name, round(b.balance)::numeric AS balance, b.txn_count
FROM public.cash_accounts a
JOIN public.v_cash_account_balance b ON b.cash_account_id = a.id
WHERE a.acct_type IN ('ho_imprest','site_petty') AND a.is_active
ORDER BY a.sort_order;
