SELECT string_agg(DISTINCT feed_type_m, ', ' ORDER BY feed_type_m) AS all_codes_m
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND feed_type_m IS NOT NULL;

WITH t AS (
  SELECT record_date, feed_type_m,
         LAG(feed_type_m) OVER (ORDER BY record_date) AS prev_type
  FROM (
    SELECT DISTINCT record_date, feed_type_m
    FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
    WHERE f.flock_no='20' AND feed_type_m IS NOT NULL
  ) x
)
SELECT string_agg(record_date::text || '->' || feed_type_m, '; ' ORDER BY record_date) AS transitions_m
FROM t
WHERE feed_type_m <> prev_type OR prev_type IS NULL;
