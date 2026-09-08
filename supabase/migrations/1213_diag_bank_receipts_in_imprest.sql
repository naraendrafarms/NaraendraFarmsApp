-- Read-only. DC 8501 (28/08/2026, Meghana Agencies, Rs 43,029) shows Online/NEFT
-- 43,029 on the sale, yet the Imprest Ledger carries it as a CASH receipt of the
-- same amount in the Bodjanampet-1 imprest. Bank money never touches the tin, so
-- either the cash book row should not be there or the sale's split is wrong.
SELECT 1 AS warmup;

-- 1. The sale itself
SELECT s.dc_no, s.sale_date::text, s.amount::numeric,
       COALESCE(s.payment_cash,0)::numeric AS payment_cash,
       COALESCE(s.payment_online,0)::numeric AS payment_online,
       COALESCE(s.amount_received,0)::numeric AS amount_received,
       COALESCE(s.payment_status,'-') AS status, COALESCE(s.payment_mode,'-') AS mode,
       (s.bank_account_id IS NOT NULL) AS has_bank_account
FROM public.nhe_sales s WHERE s.dc_no = '8501';

-- 2. Its cash book and bank rows side by side
SELECT 'cash_book' AS ledger, cb.txn_date::text, cb.amount_in::numeric AS amount,
       COALESCE(cb.payment_mode,'-') AS mode, COALESCE(fa.name,'(no site)') AS site
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
WHERE s.dc_no = '8501'
UNION ALL
SELECT 'bank_transactions', bt.txn_date::text, bt.amount::numeric, bt.txn_type, '-'
FROM public.bank_transactions bt
JOIN public.nhe_sales s ON s.id = bt.nhe_sale_id
WHERE s.dc_no = '8501';

-- 3. How widespread: sales recorded as online yet carrying a cash book receipt
SELECT count(*)::int AS sales,
       round(sum(COALESCE(s.payment_online,0)))::numeric AS online_on_sale,
       round(sum(cb.amount_in))::numeric AS also_in_a_cash_tin,
       COALESCE(min(s.sale_date)::text,'-') || ' -> ' || COALESCE(max(s.sale_date)::text,'-') AS span
FROM public.nhe_sales s
JOIN public.cash_book cb ON cb.nhe_sale_id = s.id
WHERE COALESCE(s.payment_online,0) > 0 AND COALESCE(s.payment_cash,0) = 0;

-- 4. And the reverse check: is the money counted twice, or only once in the
--    wrong place? A bank row as well as the cash row means twice.
SELECT count(*)::int AS sales_with_both_ledgers,
       round(sum(cb.amount_in))::numeric AS in_cash_tin,
       round(sum(bt.amount))::numeric AS in_bank
FROM public.nhe_sales s
JOIN public.cash_book cb ON cb.nhe_sale_id = s.id
JOIN public.bank_transactions bt ON bt.nhe_sale_id = s.id
WHERE COALESCE(s.payment_online,0) > 0;
