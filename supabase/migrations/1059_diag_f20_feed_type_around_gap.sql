SELECT d.record_date::text, d.feed_type_f, d.feed_type_m, d.feed_female_kg, d.feed_male_kg, d.remarks
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20'
  AND d.record_date BETWEEN '2026-03-20' AND '2026-04-05'
ORDER BY d.record_date, d.shed_id NULLS FIRST
LIMIT 30;

SELECT d.record_date::text, d.feed_type_f, d.feed_type_m, d.feed_female_kg, d.feed_male_kg, d.remarks
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20'
  AND d.record_date BETWEEN '2026-05-27' AND '2026-06-10'
ORDER BY d.record_date, d.shed_id NULLS FIRST
LIMIT 30;

SELECT string_agg(DISTINCT feed_type_f, ', ') AS types_before
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND d.record_date BETWEEN '2026-03-01' AND '2026-03-31' AND feed_type_f IS NOT NULL;

SELECT string_agg(DISTINCT feed_type_f, ', ') AS types_after
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND d.record_date BETWEEN '2026-06-01' AND '2026-06-30' AND feed_type_f IS NOT NULL;
