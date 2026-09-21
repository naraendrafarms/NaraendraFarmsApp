-- READ ONLY. Statement 1 of 1299 printed nothing. A UNION ALL of two
-- aggregates always returns two rows, so it did not return none - it errored
-- and the runner reported Errors: 0 anyway, because it treats "does not exist"
-- as success. Rather than guess which column is wrong, list what these two
-- tables actually have, then count each one in its own statement so a fault in
-- one cannot hide the other.

SELECT string_agg(column_name, ', ' ORDER BY column_name) AS nhe_sales_payment_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='nhe_sales'
  AND (column_name LIKE '%amount%' OR column_name LIKE '%payment%'
       OR column_name LIKE '%receiv%' OR column_name LIKE '%tds%' OR column_name LIKE '%date%');

SELECT string_agg(column_name, ', ' ORDER BY column_name) AS he_dispatch_payment_columns
FROM information_schema.columns
WHERE table_schema='public' AND table_name='he_dispatch'
  AND (column_name LIKE '%amount%' OR column_name LIKE '%payment%'
       OR column_name LIKE '%receiv%' OR column_name LIKE '%tds%' OR column_name LIKE '%date%');

SELECT count(*)::int AS nhe_rows,
       count(*) FILTER (WHERE payment_status = 'Partial')::int  AS partial,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received,
       count(*) FILTER (WHERE payment_status = 'Pending' OR payment_status IS NULL)::int AS pending,
       count(*) FILTER (WHERE payment_status = 'Received' AND received_date IS NULL)::int AS received_but_undated
FROM public.nhe_sales;

SELECT count(*)::int AS he_rows,
       count(*) FILTER (WHERE payment_status = 'Partial')::int  AS partial,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received,
       count(*) FILTER (WHERE payment_status = 'Pending' OR payment_status IS NULL)::int AS pending,
       count(*) FILTER (WHERE payment_status = 'Received' AND received_date IS NULL)::int AS received_but_undated
FROM public.he_dispatch;
