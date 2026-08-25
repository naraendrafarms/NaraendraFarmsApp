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
  SELECT COALESCE(feed_type_f, '(none recorded)') AS feed_type, feed_female_kg AS kg
  FROM filtered WHERE feed_female_kg IS NOT NULL AND feed_female_kg <> 0
  UNION ALL
  SELECT COALESCE(feed_type_m, '(none recorded)') AS feed_type, feed_male_kg AS kg
  FROM filtered WHERE feed_male_kg IS NOT NULL AND feed_male_kg <> 0
),
totals AS (
  SELECT feed_type, sum(kg) AS total_kg FROM by_type GROUP BY feed_type
)
SELECT string_agg(feed_type || '=' || round(total_kg::numeric,1), '; ' ORDER BY total_kg DESC) AS breakdown
FROM totals;
