-- Migration 733: read-only. Flock 19 was reopened to enter missing data, and
-- its NHE bird sales do not appear in Bulk Daily Entry. That screen draws one
-- row per SHED; the NHE sync writes culls either onto the first existing daily
-- record for the date, or — when none exists — into a NEW row with no shed and
-- no farm on it. Find out which shape Flock 19's data is in.

SELECT 'flock19' AS chk, f.flock_no, f.status, f.laying_farm_id IS NOT NULL AS has_laying_farm
FROM public.flocks f WHERE f.flock_no::text = '19';

SELECT 'nhe_bird_sales' AS chk, count(*)::int AS sales,
       min(sale_date) AS first_sale, max(sale_date) AS last_sale,
       count(DISTINCT sale_date)::int AS sale_days
FROM public.nhe_sales
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
  AND sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error');

-- Daily rows with NO shed on them: invisible to the Bulk Daily Entry grid,
-- which lists sheds.
SELECT 'shedless_rows' AS chk, count(*)::int AS rows_without_shed,
       count(*) FILTER (WHERE COALESCE(cull_female,0) + COALESCE(cull_male,0) > 0)::int AS of_which_carry_culls,
       min(record_date) AS first_date, max(record_date) AS last_date
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
  AND shed_id IS NULL;

-- Sale days that have NO shed-level daily record at all — nothing for the grid
-- to show even once the flock is reopened.
SELECT 'sale_days_without_shed_rows' AS chk, count(*)::int AS days
FROM (
  SELECT DISTINCT s.sale_date FROM public.nhe_sales s
  WHERE s.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
    AND s.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
    AND NOT EXISTS (SELECT 1 FROM public.daily_records d
                    WHERE d.flock_id = s.flock_id AND d.record_date = s.sale_date
                      AND d.shed_id IS NOT NULL)
) x;

SELECT 'culls_by_shed' AS chk,
       COALESCE(sh.shed_no, '(no shed)') AS shed,
       count(*)::int AS rows_with_culls,
       sum(d.cull_female)::int AS cull_female, sum(d.cull_male)::int AS cull_male
FROM public.daily_records d
LEFT JOIN public.sheds sh ON sh.id = d.shed_id
WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '19')
  AND COALESCE(d.cull_female,0) + COALESCE(d.cull_male,0) > 0
GROUP BY sh.shed_no ORDER BY 2;
