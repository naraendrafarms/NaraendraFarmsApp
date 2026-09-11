-- The payslip now reads its figures off the salary register instead of working
-- them out again, and the register carries EXTRA DAYS PAY as a line of its own
-- (salary_monthly.extra_pay, migration 165). Without somewhere to keep it, a
-- saved payslip would lose it and its Gross Earnings would come back short of
-- the register's Total Earning when the slip was reopened.
--
-- Additive and defaulted, so every existing payslip reads 0 - which is what
-- they were printed with.
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS extra_pay NUMERIC(12,2) DEFAULT 0;

NOTIFY pgrst, 'reload schema';

-- VERIFY: the column must actually exist. run_sql.py treats "already exists" as
-- success, so a silent failure would otherwise look identical to a clean run.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'extra_pay';

-- VERIFY: nothing was disturbed - every existing payslip keeps its figures and
-- reads 0 extra days pay.
SELECT count(*)::int AS payslips,
       count(*) FILTER (WHERE extra_pay = 0)::int AS extra_pay_zero,
       count(*) FILTER (WHERE extra_pay IS NULL)::int AS extra_pay_null
FROM public.payslips;
