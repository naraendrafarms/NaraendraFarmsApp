-- READ ONLY. 1268's own verify statements were 8th and 9th in the file and
-- run_sql.py prints only the first five, so its "Errors: 0" said nothing about
-- whether the functions actually work. This checks them where they will print.
SELECT 1 AS warmup;

-- Do the three functions exist, and is fn_current_fy right at the boundaries?
SELECT (SELECT count(*)::int FROM pg_proc WHERE proname = 'fn_current_fy')   AS fn_current_fy_exists,
       (SELECT count(*)::int FROM pg_proc WHERE proname = 'fn_next_invoice') AS fn_next_exists,
       (SELECT count(*)::int FROM pg_proc WHERE proname = 'fn_peek_invoice') AS fn_peek_exists,
       public.fn_current_fy(DATE '2026-09-18') AS today_should_be_26_27,
       public.fn_current_fy(DATE '2027-03-31') AS mar31_2027_should_be_26_27,
       public.fn_current_fy(DATE '2027-04-01') AS apr01_2027_should_be_27_28,
       public.fn_current_fy(DATE '2028-03-31') AS mar31_2028_should_be_27_28,
       public.fn_current_fy(DATE '2028-04-01') AS apr01_2028_should_be_28_29;

-- Peek must still read today's year and must still consume nothing.
SELECT code, fy, current_no, public.fn_peek_invoice(code) AS peek_now
FROM public.invoice_series ORDER BY code;

-- Prove peek consumed nothing: the counters must be untouched by the line above.
SELECT string_agg(code || '=' || current_no, ', ' ORDER BY code) AS counters_after_peek,
       CASE WHEN (SELECT current_no FROM public.invoice_series WHERE code='HHF') = 77
            THEN 'HHF still 77 - peek consumed nothing'
            ELSE 'HHF MOVED - PEEK IS CONSUMING' END AS peek_side_effect_check
FROM public.invoice_series;
