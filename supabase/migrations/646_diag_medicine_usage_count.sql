-- Diagnostic only. One question: why does a COUNT over medicine_usage's new
-- columns print nothing?
--
-- In 642 the statement was in position 3 and printed nothing while 2 and 4
-- printed. In 645 the same query was in position 1 and again printed nothing
-- while 2 to 5 printed. So it is not the position in the file -- it is that
-- query. run_sql.py hides any error containing "does not exist", so a statement
-- that vanishes is indistinguishable from one that failed. The medicine data
-- must be counted in a form that cannot vanish before anyone is told it is
-- intact.
--
-- Each statement below isolates one suspect, and each returns a row on its own.

-- 1. The plainest possible count. If THIS prints, the table and its rows are
--    fine and the problem is in the shape of the earlier query.
SELECT COUNT(*) AS medicine_usage_rows FROM public.medicine_usage;

-- 2. The two new columns counted on their own, cast to text so the result can
--    never be mistaken for an empty response.
SELECT COUNT(shed_id)::text AS rows_with_shed, COUNT(line_id)::text AS rows_with_line
FROM public.medicine_usage;

-- 3. The money, unchanged: total amount and the date range it spans.
SELECT COALESCE(SUM(amount), 0)::text AS total_amount,
       MIN(usage_date)::text AS first_usage, MAX(usage_date)::text AS last_usage,
       COUNT(DISTINCT flock_id)::text AS flocks
FROM public.medicine_usage;

-- 4. The exact clause the vanished query used -- COUNT(*) FILTER -- on its own,
--    to see whether that is what run_sql.py is choking on.
SELECT COUNT(*) FILTER (WHERE flock_id IS NOT NULL) AS rows_with_flock
FROM public.medicine_usage;

-- 5. And the same four figures the vanished statement asked for, in one row,
--    all cast to text.
SELECT COUNT(*)::text AS rows_all,
       COUNT(flock_id)::text AS rows_with_flock,
       COUNT(shed_id)::text AS rows_with_shed,
       COUNT(line_id)::text AS rows_with_line
FROM public.medicine_usage;
