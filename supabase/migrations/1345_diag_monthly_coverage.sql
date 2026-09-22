-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Nothing is written.
-- How many of a flock's active months actually carry a salary bill, an
-- electricity bill and farm expenses? That decides whether the figures on the
-- Cost & Income tab are the whole story or only the months somebody entered.

-- 1. months each flock was active, and its site(s)
SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS active_months
FROM (
  SELECT f.flock_no,
         'F' || f.flock_no || ' months=' || COUNT(DISTINCT to_char(d.record_date, 'YYYY-MM'))
           || ' from=' || to_char(MIN(d.record_date), 'YYYY-MM')
           || ' to=' || to_char(MAX(d.record_date), 'YYYY-MM') AS line
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   GROUP BY f.flock_no
) s;

-- 2. electricity: which months carry a bill at all, and the average
SELECT 'elec months=' || COUNT(DISTINCT to_char(bill_month, 'YYYY-MM'))
    || ' bills=' || COUNT(*)
    || ' total=' || ROUND(COALESCE(SUM(amount), 0))
    || ' avgPerMonth=' || ROUND(COALESCE(SUM(amount), 0)
         / NULLIF(COUNT(DISTINCT to_char(bill_month, 'YYYY-MM')), 0))
    || ' first=' || COALESCE(to_char(MIN(bill_month), 'YYYY-MM'), '-')
    || ' last=' || COALESCE(to_char(MAX(bill_month), 'YYYY-MM'), '-')
    AS electricity
  FROM public.electricity_bills;

-- 3. salary: months covered and the average monthly wage bill
SELECT 'salary months=' || COUNT(DISTINCT month)
    || ' rows=' || COUNT(*)
    || ' totalEarned=' || ROUND(COALESCE(SUM(earned_salary), 0))
    || ' avgPerMonth=' || ROUND(COALESCE(SUM(earned_salary), 0) / NULLIF(COUNT(DISTINCT month), 0))
    || ' first=' || COALESCE(MIN(month)::text, '-')
    || ' last=' || COALESCE(MAX(month)::text, '-')
    AS salary
  FROM public.salary_monthly;

-- 4. farm expenses: months covered and the average
SELECT 'farmexp months=' || COUNT(DISTINCT to_char(expense_date, 'YYYY-MM'))
    || ' rows=' || COUNT(*)
    || ' total=' || ROUND(COALESCE(SUM(amount), 0))
    || ' avgPerMonth=' || ROUND(COALESCE(SUM(amount), 0)
         / NULLIF(COUNT(DISTINCT to_char(expense_date, 'YYYY-MM')), 0))
    || ' first=' || COALESCE(to_char(MIN(expense_date), 'YYYY-MM'), '-')
    || ' last=' || COALESCE(to_char(MAX(expense_date), 'YYYY-MM'), '-')
    AS farm_expenses
  FROM public.farm_expenses;
