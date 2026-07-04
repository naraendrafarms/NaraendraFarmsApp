-- Migration 355: diagnostic — what data currently exists for Flock 21 (Bodjanampet-2, VHL)
-- Read-only, no schema/data changes.

-- A. Flock basic info
SELECT id, flock_no, laying_farm_id, rearing_farm_id, status, breed, placement_date,
  total_placed_f, total_placed_m
FROM public.flocks WHERE flock_no = '21' OR flock_no ILIKE '%21%'
ORDER BY flock_no;

-- B. Farm record for Bodjanampet-2
SELECT id, name, code, type, is_active FROM public.farms WHERE name ILIKE '%bodjanampet%';

-- C. Daily records count + date range for flock 21 (need flock id from A first — use subquery)
SELECT COUNT(*) AS daily_record_rows, MIN(record_date) AS first_date, MAX(record_date) AS last_date
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '21' LIMIT 1);

-- D. Medicine usage rows for flock 21
SELECT COUNT(*) AS medicine_usage_rows, MIN(usage_date) AS first_date, MAX(usage_date) AS last_date, SUM(amount) AS total_amount
FROM public.medicine_usage
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '21' LIMIT 1);

-- E. Feed usage rows for flock 21
SELECT COUNT(*) AS daily_feed_rows, MIN(feed_date) AS first_date, MAX(feed_date) AS last_date
FROM public.daily_feed
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '21' LIMIT 1);

-- F. HE dispatch + NHE sales rows for flock 21 (production sold so far)
SELECT COUNT(*) AS he_dispatch_rows, MIN(dispatch_date) AS first_date, MAX(dispatch_date) AS last_date, SUM(amount) AS total_amount
FROM public.he_dispatch
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '21' LIMIT 1);

SELECT sale_type, COUNT(*) AS rows, SUM(amount) AS total_amount
FROM public.nhe_sales
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '21' LIMIT 1)
GROUP BY sale_type;
