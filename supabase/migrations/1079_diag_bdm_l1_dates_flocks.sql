WITH ranked AS (
  SELECT d.*,
    EXISTS (
      SELECT 1 FROM public.daily_records d2
      WHERE d2.flock_id = d.flock_id AND d2.record_date = d.record_date AND d2.shed_id IS NOT NULL
    ) AS has_shed_rows
  FROM public.daily_records d
  WHERE d.record_date BETWEEN '2026-04-01' AND '2026-08-24'
),
filtered AS (
  SELECT * FROM ranked WHERE (has_shed_rows AND shed_id IS NOT NULL) OR (NOT has_shed_rows)
),
by_type AS (
  SELECT flock_id, record_date, feed_type_f AS feed_type, feed_female_kg AS kg
  FROM filtered WHERE feed_female_kg IS NOT NULL AND feed_female_kg <> 0 AND feed_type_f IN ('BDM','L1')
  UNION ALL
  SELECT flock_id, record_date, feed_type_m AS feed_type, feed_male_kg AS kg
  FROM filtered WHERE feed_male_kg IS NOT NULL AND feed_male_kg <> 0 AND feed_type_m IN ('BDM','L1')
)
SELECT f.flock_no, b.feed_type, round(sum(b.kg)::numeric,1) AS total_kg, count(*)::int AS n_rows,
  min(b.record_date)::text AS first_date, max(b.record_date)::text AS last_date
FROM by_type b JOIN public.flocks f ON f.id = b.flock_id
GROUP BY f.flock_no, b.feed_type
ORDER BY b.feed_type, f.flock_no;
