-- Verification-only — confirms migration 460 actually landed. run_sql.py only
-- prints row-count previews for the first 5 statements in a file, so these
-- diagnostics need their own file to actually show output in the job log.
SELECT count(*) AS tds_challans_table_exists FROM information_schema.tables WHERE table_name='tds_challans';
SELECT column_name FROM information_schema.columns WHERE table_name='tds_challans' ORDER BY ordinal_position;
SELECT count(*) AS pp_challan_col FROM information_schema.columns WHERE table_name='pending_payments' AND column_name='tds_challan_id';
SELECT count(*) AS sm_challan_col FROM information_schema.columns WHERE table_name='salary_monthly' AND column_name='tds_challan_id';
SELECT count(*) AS cs_tan_col FROM information_schema.columns WHERE table_name='company_settings' AND column_name='tan_no';
