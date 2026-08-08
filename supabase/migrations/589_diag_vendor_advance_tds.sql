-- Diagnostic only (no schema changes).
--
-- Reports -> TDS Payable reads supplier bills (pending_payments) and salaries
-- (salary_monthly) only. TDS deducted on VENDOR ADVANCES is recorded on
-- vendor_advances (migration 462 added tds_pct/amount/section/deposited/
-- challan) but never reaches the report, so the monthly statement printed for
-- filing is understated by exactly that amount. Measure how much before
-- changing the report.

SELECT COUNT(*) AS advances_total,
       COUNT(*) FILTER (WHERE COALESCE(tds_amount, 0) > 0) AS advances_with_tds,
       COALESCE(ROUND(SUM(tds_amount) FILTER (WHERE COALESCE(tds_amount, 0) > 0)), 0) AS tds_total,
       COUNT(*) FILTER (WHERE COALESCE(tds_amount, 0) > 0 AND tds_deposited) AS tds_deposited_count,
       COUNT(*) FILTER (WHERE COALESCE(tds_amount, 0) > 0 AND COALESCE(tds_section, '') = '') AS tds_without_section
FROM public.vendor_advances;

-- Month-wise, so the size of the gap per filing period is visible.
SELECT COALESCE(string_agg(m || '=' || n || '/' || amt, ', ' ORDER BY m), 'NONE') AS advance_tds_by_month
FROM (
  SELECT to_char(advance_date, 'YYYY-MM') AS m, COUNT(*) AS n, ROUND(SUM(tds_amount)) AS amt
  FROM public.vendor_advances
  WHERE COALESCE(tds_amount, 0) > 0
  GROUP BY to_char(advance_date, 'YYYY-MM')
) x;

-- The rows themselves, so the report can be checked against them afterwards.
SELECT COALESCE(string_agg(
         advance_date::text || ' [' || COALESCE(p.name, '?') || '] amt=' || va.amount ||
         ' tds=' || va.tds_amount || ' sec=' || COALESCE(va.tds_section, '-') ||
         ' dep=' || CASE WHEN va.tds_deposited THEN 'Y' ELSE 'N' END,
         ' | ' ORDER BY va.advance_date), 'NONE') AS advance_tds_rows
FROM public.vendor_advances va
LEFT JOIN public.parties p ON p.id = va.party_id
WHERE COALESCE(va.tds_amount, 0) > 0;

-- Confirm the columns the report will need actually exist.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY column_name), 'MISSING') AS tds_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vendor_advances'
  AND column_name IN ('tds_pct','tds_amount','tds_section','tds_interest',
                      'tds_deposited','tds_deposit_date','tds_challan_id');
