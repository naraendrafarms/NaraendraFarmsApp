SELECT f.flock_no, d.shed_id IS NOT NULL AS has_shed,
       count(*) FILTER (WHERE d.feed_female_kg IS NOT NULL AND d.feed_female_kg <> 0 AND (d.feed_type_f IS NULL OR d.feed_type_f = ''))::int AS n_missing_female_type,
       count(*) FILTER (WHERE d.feed_male_kg IS NOT NULL AND d.feed_male_kg <> 0 AND (d.feed_type_m IS NULL OR d.feed_type_m = ''))::int AS n_missing_male_type,
       min(d.record_date)::text AS first_missing_date,
       max(d.record_date)::text AS last_missing_date,
       count(*)::int AS n_rows_total
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.record_date BETWEEN '2026-04-01' AND '2026-08-24'
  AND ((d.feed_female_kg IS NOT NULL AND d.feed_female_kg <> 0 AND (d.feed_type_f IS NULL OR d.feed_type_f = ''))
    OR (d.feed_male_kg IS NOT NULL AND d.feed_male_kg <> 0 AND (d.feed_type_m IS NULL OR d.feed_type_m = '')))
GROUP BY f.flock_no, d.shed_id IS NOT NULL
ORDER BY f.flock_no;

SELECT remarks, count(*)::int AS n, min(record_date)::text AS first_date, max(record_date)::text AS last_date
FROM public.daily_records
WHERE record_date BETWEEN '2026-04-01' AND '2026-08-24'
  AND ((feed_female_kg IS NOT NULL AND feed_female_kg <> 0 AND (feed_type_f IS NULL OR feed_type_f = ''))
    OR (feed_male_kg IS NOT NULL AND feed_male_kg <> 0 AND (feed_type_m IS NULL OR feed_type_m = '')))
GROUP BY remarks
ORDER BY n DESC
LIMIT 10;
