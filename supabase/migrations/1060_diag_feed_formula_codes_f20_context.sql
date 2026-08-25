SELECT string_agg(DISTINCT code, ', ' ORDER BY code) AS all_feed_codes
FROM public.feed_formulas;

SELECT d.record_date::text, d.feed_type_f, d.feed_type_m, d.remarks
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND d.feed_type_f IS NOT NULL
ORDER BY d.record_date
LIMIT 5;

SELECT d.record_date::text, d.feed_type_f, d.feed_type_m, d.remarks
FROM public.daily_records d JOIN public.flocks f ON f.id=d.flock_id
WHERE f.flock_no='20' AND d.feed_type_f IS NOT NULL
ORDER BY d.record_date DESC
LIMIT 5;
