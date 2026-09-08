-- Read-only. I said the 17 site-less NHE cash receipts (Rs 6,37,463) are sitting
-- in HO Imprest. The owner cannot see them there, so check it rather than repeat
-- the claim: which account the imprest view really puts them in, whether they
-- count toward a balance at all, and what HO Imprest holds.
SELECT 1 AS warmup;

-- 1. The 17 rows as the Imprest Ledger itself sees them
SELECT COALESCE(a.name,'(no account at all)') AS lands_in,
       v.derived AS account_was_derived,
       v.counts_to_balance,
       COALESCE(v.payment_mode,'(null)') AS payment_mode,
       count(*)::int AS rows,
       round(sum(COALESCE(v.amount_in,0)))::numeric AS amount_in
FROM public.v_imprest_entries v
JOIN public.nhe_sales s ON s.id = v.nhe_sale_id
LEFT JOIN public.cash_accounts a ON a.id = v.cash_account_id
WHERE v.farm_id IS NULL
GROUP BY 1,2,3,4 ORDER BY 5 DESC;

-- 2. Are they even in the view? The view carries every cash_book row, but the
--    ledger screen lists cash only, so a non-cash payment_mode would vanish.
SELECT count(*)::int AS site_less_cash_book_rows,
       count(*) FILTER (WHERE COALESCE(cb.payment_mode,'cash') = 'cash')::int AS mode_is_cash,
       count(*) FILTER (WHERE COALESCE(cb.payment_mode,'cash') <> 'cash')::int AS mode_is_not_cash,
       COALESCE(string_agg(DISTINCT COALESCE(cb.payment_mode,'(null)'), ', '), '-') AS modes,
       COALESCE(min(cb.txn_date)::text,'-') || ' -> ' || COALESCE(max(cb.txn_date)::text,'-') AS span
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
WHERE cb.farm_id IS NULL;

-- 3. What HO Imprest holds in total, and how much of it is these sale receipts
SELECT a.name, round(b.opening_balance)::numeric AS opening,
       round(b.total_in)::numeric AS total_in, round(b.total_out)::numeric AS total_out,
       round(b.balance)::numeric AS balance, b.txn_count,
       (SELECT count(*)::int FROM public.v_imprest_entries v
        WHERE v.cash_account_id = a.id AND v.nhe_sale_id IS NOT NULL) AS nhe_sale_rows_in_it
FROM public.cash_accounts a
JOIN public.v_cash_account_balance b ON b.cash_account_id = a.id
WHERE a.acct_type = 'ho_imprest';

-- 4. The 17 listed, so they can be found on screen
SELECT cb.txn_date::text AS date, cb.description, cb.party_name,
       round(cb.amount_in)::numeric AS amount_in,
       COALESCE(cb.payment_mode,'(null)') AS mode,
       COALESCE(a.name,'(derived)') AS account_on_row
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.cash_accounts a ON a.id = cb.cash_account_id
WHERE cb.farm_id IS NULL
ORDER BY cb.txn_date;
