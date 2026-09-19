-- READ ONLY. What "Extra Days" actually grants today, per designation, and how
-- much it added to the last full salary month. Asked what it is; answering
-- from the real configuration rather than from the code comments.

SELECT count(*)::int AS designations_configured,
       count(*) FILTER (WHERE ge15 > 0)::int AS grant_days_when_15_or_more_worked,
       count(*) FILTER (WHERE lt15 > 0)::int AS grant_days_when_under_15_worked
FROM public.designation_extra_days;

SELECT designation, ge15 AS extra_days_if_worked_15_or_more, lt15 AS extra_days_if_worked_under_15
FROM public.designation_extra_days
ORDER BY ge15 DESC, designation
LIMIT 12;

SELECT to_char(month,'YYYY-MM') AS salary_month,
       count(*)::int                                   AS employees,
       count(*) FILTER (WHERE COALESCE(extra_days,0) > 0)::int AS got_extra_days,
       round(sum(COALESCE(extra_days,0)))::int         AS extra_days_total,
       round(sum(COALESCE(extra_pay,0)))::int          AS extra_pay_total,
       round(sum(COALESCE(total_earning,0)))::int      AS total_earning
FROM public.salary_monthly
WHERE month >= date '2026-06-01'
GROUP BY to_char(month,'YYYY-MM')
ORDER BY 1 DESC;
