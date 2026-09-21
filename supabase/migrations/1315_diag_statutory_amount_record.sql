-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- The owner asks whether a statutory challan paid for MORE or LESS than the
-- app computed can be recorded. The form only offers an amount box for
-- advance tax and late fee; everything else is forced to the computed figure.
-- Before saying that, check three things against the real data:
--   - what is actually stored on each liability row, and when it was written
--   - whether the stored figure still equals what the page computes today
--   - whether the table even has somewhere to put a different paid amount

-- 1. Every liability row as stored
SELECT liability_type, period::text AS period,
       round(COALESCE(amount_due,0))::int AS stored_amount,
       status, COALESCE(challan_no,'-') AS challan_no,
       paid_date::text AS paid_date,
       to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YY HH24:MI') AS created_ist,
       to_char(updated_at AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YY HH24:MI') AS updated_ist,
       COALESCE(remarks,'-') AS remarks
FROM public.statutory_liabilities
ORDER BY period, liability_type;

-- 2. What the Statutory page computes for August now, on both ESI bases, so
--    the stored figure can be compared with what the screen shows today.
SELECT 'Aug 2026' AS mon,
       round(sum(COALESCE(s.esi_employee,0)) FILTER (WHERE e.esi_applicable))::int AS esi_employee,
       round(sum(COALESCE(s.esi_employer,0)) FILTER (WHERE e.esi_applicable))::int AS esi_er_per_person,
       ceil(sum(COALESCE(s.basic_salary,0)) FILTER (WHERE e.esi_applicable) * 0.0325)::int AS esi_er_challan,
       (round(sum(COALESCE(s.esi_employee,0)) FILTER (WHERE e.esi_applicable))
        + ceil(sum(COALESCE(s.basic_salary,0)) FILTER (WHERE e.esi_applicable) * 0.0325))::int AS esi_total_now,
       (round(sum(COALESCE(s.esi_employee,0)) FILTER (WHERE e.esi_applicable))
        + round(sum(COALESCE(s.esi_employer,0)) FILTER (WHERE e.esi_applicable)))::int AS esi_total_before_fix,
       round(sum(COALESCE(s.pf_employee,0) + COALESCE(s.employer_eps,0) + COALESCE(s.employer_epf_diff,0)
             + COALESCE(s.admin_charges,0) + COALESCE(s.edli_charge,0)) FILTER (WHERE e.pf_applicable))::int AS pf_total_now
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month = DATE '2026-08-01';

-- 3. Is there anywhere at all to record a DIFFERENT amount actually paid
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'NONE') AS columns_on_statutory_liabilities
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'statutory_liabilities';

-- 4. Same question for a vendor advance started from the Bank Ledger: what
--    does a vendor_advances row require that a bank transaction has no field
--    for? These are the columns an advance carries beyond a plain payment.
SELECT COALESCE(string_agg(column_name, ', ' ORDER BY ordinal_position), 'NONE') AS columns_on_vendor_advances
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vendor_advances';

-- 5. How advances are recorded today, and how many already carry a bank row
SELECT count(*)::int AS advances,
       count(*) FILTER (WHERE COALESCE(tds_amount,0) > 0)::int AS with_tds,
       round(sum(COALESCE(amount,0)))::int AS total_amount,
       (SELECT count(*)::int FROM public.bank_transactions WHERE vendor_advance_id IS NOT NULL) AS bank_rows_tagged,
       (SELECT count(*)::int FROM public.cash_book WHERE vendor_advance_id IS NOT NULL) AS cash_rows_tagged
FROM public.vendor_advances;
