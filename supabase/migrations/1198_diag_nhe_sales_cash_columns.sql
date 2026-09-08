-- Read-only. 1197's first four statements printed nothing while the fifth worked,
-- which is run_sql.py swallowing a "does not exist" error as success. They all
-- referenced nhe_sales.cash_farm_id. Settle whether that column is really there,
-- and which of the payment fields the NHE Sales edit form reads actually exist.

-- 1. Which of the fields the form reads exist on nhe_sales
SELECT string_agg(column_name || ':' || data_type, ', ' ORDER BY column_name) AS present
FROM information_schema.columns
WHERE table_schema='public' AND table_name='nhe_sales'
  AND column_name IN ('cash_farm_id','cash_account_id','payment_cash','payment_online',
                      'amount_received','payment_status','payment_mode','bank_account_id','received_date');

-- 2. The same list, said the other way round: what the form asks for and does NOT exist
SELECT string_agg(w.col, ', ' ORDER BY w.col) AS missing
FROM (VALUES ('cash_farm_id'),('cash_account_id'),('payment_cash'),('payment_online'),
             ('amount_received'),('payment_status'),('payment_mode'),('bank_account_id'),('received_date')) AS w(col)
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
                  WHERE c.table_schema='public' AND c.table_name='nhe_sales' AND c.column_name = w.col);

-- 3. Every column nhe_sales actually has, so nothing else is guessed at
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS all_columns
FROM information_schema.columns WHERE table_schema='public' AND table_name='nhe_sales';

-- 4. Where the cash actually lands: cash_book rows linked to an NHE sale, by site and imprest
SELECT COALESCE(fa.name,'(no site)') AS cash_book_site,
       COALESCE(ca.name,'(derived, none stored)') AS imprest_on_row,
       count(*)::int AS rows, COALESCE(sum(cb.amount),0)::numeric AS amount
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
LEFT JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
GROUP BY fa.name, ca.name ORDER BY 3 DESC;
