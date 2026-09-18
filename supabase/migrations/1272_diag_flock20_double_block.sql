-- READ ONLY. Daily Summary shows one block per flock PER SITE, worked out from
-- the sites of the sheds on that day's rows. A flock genuinely at two sites
-- gets two blocks by design. But a row with NO shed has no site, and that null
-- counts as a site of its own - so a date holding BOTH shed rows and a
-- flock-level row would produce two blocks for the SAME site, which reads as
-- the flock appearing twice.
SELECT 1 AS warmup;

-- Flock 20: dates with more than one distinct site, and whether a null is
-- among them. shed_id IS NULL is what would make a false duplicate.
SELECT d.record_date::text AS the_date,
       count(*)::int                                          AS rows_that_day,
       count(*) FILTER (WHERE d.shed_id IS NULL)::int          AS rows_with_no_shed,
       count(DISTINCT s.farm_id)::int                          AS distinct_real_sites,
       (count(DISTINCT s.farm_id) + (CASE WHEN count(*) FILTER (WHERE d.shed_id IS NULL) > 0 THEN 1 ELSE 0 END))::int
         AS blocks_daily_summary_would_draw
FROM public.daily_records d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '20'
GROUP BY d.record_date
HAVING (count(DISTINCT s.farm_id) + (CASE WHEN count(*) FILTER (WHERE d.shed_id IS NULL) > 0 THEN 1 ELSE 0 END)) > 1
ORDER BY d.record_date DESC
LIMIT 15;

-- How widespread is it: any flock, any date, drawing more than one block.
SELECT f.flock_no::text AS flock,
       count(*)::int AS dates_drawing_more_than_one_block,
       count(*) FILTER (WHERE x.rows_with_no_shed > 0)::int AS of_which_caused_by_a_shedless_row,
       max(x.the_date)::text AS most_recent
FROM (
  SELECT d.flock_id, d.record_date AS the_date,
         count(*) FILTER (WHERE d.shed_id IS NULL)::int AS rows_with_no_shed,
         count(DISTINCT s.farm_id)::int AS sites
  FROM public.daily_records d
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  GROUP BY d.flock_id, d.record_date
) x
JOIN public.flocks f ON f.id = x.flock_id
WHERE (x.sites + CASE WHEN x.rows_with_no_shed > 0 THEN 1 ELSE 0 END) > 1
GROUP BY f.flock_no ORDER BY f.flock_no;

-- Overall: how many daily_records rows carry no shed at all.
SELECT count(*)::int AS total_daily_rows,
       count(*) FILTER (WHERE shed_id IS NULL)::int AS rows_with_no_shed,
       min(record_date) FILTER (WHERE shed_id IS NULL)::text AS first_shedless,
       max(record_date) FILTER (WHERE shed_id IS NULL)::text AS last_shedless
FROM public.daily_records;
