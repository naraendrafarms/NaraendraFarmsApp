SELECT feed_type_f, count(*)::int AS n_rows, min(record_date)::text AS first_date, max(record_date)::text AS last_date
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND record_date BETWEEN '2026-02-07' AND '2026-05-17'
GROUP BY feed_type_f
ORDER BY feed_type_f;

SELECT count(*)::int AS n_rows_changed_by_1064
FROM public.daily_records
WHERE remarks = 'F20_IMPORT_2026-08-24'
  AND record_date BETWEEN '2026-02-07' AND '2026-05-17'
  AND feed_type_f = 'L3';
