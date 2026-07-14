SELECT count(*) AS tds_section_options FROM public.config_options WHERE grp = 'tds_section';
SELECT value, label FROM public.config_options WHERE grp = 'tds_section' ORDER BY sort_order;
SELECT count(*) AS parties_cols FROM information_schema.columns
  WHERE table_name='parties' AND column_name IN ('pan_no','deductee_type');
SELECT count(*) AS partners_col FROM information_schema.columns
  WHERE table_name='partners' AND column_name = 'deductee_type';
SELECT count(*) AS employees_col FROM information_schema.columns
  WHERE table_name='employees' AND column_name = 'pan_no';
SELECT count(*) AS pp_cols FROM information_schema.columns
  WHERE table_name='pending_payments' AND column_name IN ('tds_section','tds_interest');
SELECT count(*) AS sm_cols FROM information_schema.columns
  WHERE table_name='salary_monthly' AND column_name IN ('tds_section','tds_interest');
SELECT count(*) AS ssr_table_exists FROM information_schema.tables WHERE table_name='stock_statement_rates';
