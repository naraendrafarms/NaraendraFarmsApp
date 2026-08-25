SELECT string_agg(DISTINCT feed_type_f, ', ' ORDER BY feed_type_f) AS all_codes
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND feed_type_f IS NOT NULL;

WITH t AS (
  SELECT record_date, feed_type_f,
         LAG(feed_type_f) OVER (ORDER BY record_date) AS prev_type
  FROM (
    SELECT DISTINCT record_date, feed_type_f
    FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
    WHERE f.flock_no='20' AND feed_type_f IS NOT NULL
  ) x
)
SELECT string_agg(record_date::text || '->' || feed_type_f, '; ' ORDER BY record_date) AS transitions
FROM t
WHERE feed_type_f <> prev_type OR prev_type IS NULL;
