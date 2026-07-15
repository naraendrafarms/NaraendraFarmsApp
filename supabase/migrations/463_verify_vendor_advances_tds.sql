-- Verify-only migration for 462 — run_sql.py truncates printed statement
-- output after the first few statements, so re-run the diagnostics alone to
-- actually see the results (not just "Errors: 0").
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name='vendor_advances' AND column_name IN
    ('tds_pct','tds_amount','tds_section','tds_interest','tds_deposited','tds_deposit_date','tds_challan_id')
  ORDER BY column_name;

SELECT count(*) AS view_exists FROM information_schema.views WHERE table_name='v_party_ledger';

SELECT count(*) AS vendor_advance_rows_in_ledger FROM public.v_party_ledger WHERE source_table = 'vendor_advance';

SELECT count(*) AS total_vendor_advances FROM public.vendor_advances WHERE party_id IS NOT NULL;

-- Spot-check: pick one party with an existing vendor advance and show their
-- full ledger (running balance math) to confirm the new "Advance Paid"
-- credit row lands correctly and reduces outstanding balance.
SELECT (SELECT party_id FROM public.vendor_advances WHERE party_id IS NOT NULL LIMIT 1) AS spot_check_party_id;

SELECT txn_date, txn_type, ref_no, narration, debit, credit, source_table
  FROM public.v_party_ledger
  WHERE party_id = (SELECT party_id FROM public.vendor_advances WHERE party_id IS NOT NULL LIMIT 1)
  ORDER BY txn_date, txn_type;
