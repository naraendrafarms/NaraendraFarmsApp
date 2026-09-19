-- READ ONLY. Redo of 1296, which named ge15 / lt15. The real columns are
-- extra_days_ge15 and extra_days_lt15 (migration 175), so both statements
-- errored and run_sql.py still reported Errors: 0 because it treats "does not
-- exist" as success. Verified the column names against the migration this time.

SELECT count(*)::int AS designations_configured,
       count(*) FILTER (WHERE extra_days_ge15 > 0)::int AS grant_when_15_or_more_days_worked,
       count(*) FILTER (WHERE extra_days_lt15 > 0)::int AS grant_when_under_15_days_worked,
       max(extra_days_ge15)                             AS most_days_granted
FROM public.designation_extra_days;

SELECT designation,
       extra_days_ge15 AS if_worked_15_or_more,
       extra_days_lt15 AS if_worked_under_15
FROM public.designation_extra_days
ORDER BY extra_days_ge15 DESC, designation
LIMIT 10;
