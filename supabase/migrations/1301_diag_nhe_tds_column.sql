-- READ ONLY. 1299's receivables statement errored because nhe_sales has no
-- tds_amount column. That matters well beyond my diagnostic: Payment Planning
-- SELECTS tds_amount from nhe_sales when it builds the pending receivables
-- list. PostgREST rejects the whole request when a named column does not
-- exist, and that call passes no error handler, so the NHE half of the
-- receivables would come back EMPTY and silently - exactly the failure mode
-- the Pending Payments page hit before.
--
-- Confirming the column is really absent, and measuring how much money is
-- sitting in the NHE sales that would be missing from that figure.

SELECT (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema='public' AND table_name='nhe_sales'
           AND column_name='tds_amount')                       AS nhe_has_tds_amount,
       (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema='public' AND table_name='he_dispatch'
           AND column_name='tds_amount')                       AS he_has_tds_amount,
       (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema='public' AND table_name='nhe_sales'
           AND column_name='is_employee_sale')                 AS nhe_has_is_employee_sale;

-- What the receivables figure would be missing if the NHE half returns empty.
SELECT count(*)::int AS nhe_still_owed_rows,
       round(COALESCE(sum(GREATEST(0, COALESCE(amount,0) - COALESCE(amount_received,0))),0))::int AS nhe_still_owed_amount
FROM public.nhe_sales
WHERE (payment_status IN ('Pending','Partial') OR payment_status IS NULL);

SELECT count(*)::int AS he_still_owed_rows,
       round(COALESCE(sum(GREATEST(0, COALESCE(amount,0) - COALESCE(tds_amount,0) - COALESCE(amount_received,0))),0))::int AS he_still_owed_amount
FROM public.he_dispatch
WHERE (payment_status IN ('Pending','Partial') OR payment_status IS NULL);
