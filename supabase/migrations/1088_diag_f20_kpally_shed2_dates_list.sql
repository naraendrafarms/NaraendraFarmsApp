SELECT string_agg(record_date::text || '=' || opening_female::text || '/' || opening_male::text, ', ' ORDER BY record_date DESC) AS recent
FROM (
  SELECT record_date, opening_female, opening_male
  FROM public.daily_records
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
  ORDER BY record_date DESC
  LIMIT 8
) x;
