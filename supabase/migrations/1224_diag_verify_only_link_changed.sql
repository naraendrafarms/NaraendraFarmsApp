-- Read-only. Two questions from the owner:
--   (a) was anything other than the link touched - eggs, dates, hatch results;
--   (b) the date order looks wrong where one invoice spans several batches.
-- The backup taken in 1222 holds every Flock 20 batch as it was BEFORE, so (a)
-- can be proved rather than claimed.
SELECT 1 AS warmup;

-- 1. Compare every batch against its backup. Anything other than 0 here means I
--    changed something I said I would not.
SELECT count(*)::int AS batches_checked,
       count(*) FILTER (WHERE b.eggs_set IS DISTINCT FROM hb.eggs_set)::int AS eggs_set_changed,
       count(*) FILTER (WHERE b.setting_date IS DISTINCT FROM hb.setting_date)::int AS setting_date_changed,
       count(*) FILTER (WHERE b.hatchery_name IS DISTINCT FROM hb.hatchery_name)::int AS hatchery_changed,
       count(*) FILTER (WHERE b.old_dispatch_id IS NOT NULL
                          AND b.old_dispatch_id IS DISTINCT FROM hb.dispatch_id)::int AS existing_link_overwritten
FROM public.hatch_batches_link_1222 b
JOIN public.hatch_batches hb ON hb.id = b.id;

-- 2. The real correctness test: eggs cannot be SET before they were DISPATCHED.
--    Any batch whose dispatch is later than its setting date is linked wrongly.
SELECT count(*)::int AS batches,
       count(*) FILTER (WHERE hb.setting_date < d.dispatch_date)::int AS set_before_dispatched_IMPOSSIBLE,
       count(*) FILTER (WHERE hb.setting_date >= d.dispatch_date)::int AS plausible,
       round(avg(hb.setting_date - d.dispatch_date), 1) AS avg_days_dispatch_to_setting,
       min(hb.setting_date - d.dispatch_date) AS min_gap,
       max(hb.setting_date - d.dispatch_date) AS max_gap
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

-- 3. Does the invoice sequence keep step with the setting-date sequence
SELECT count(*)::int AS batches_in_order_check,
       count(*) FILTER (WHERE d.dispatch_date < prev_dispatch)::int AS invoice_goes_BACKWARDS
FROM (
  SELECT hb.id, hb.setting_date, hb.dispatch_id,
         lag(d2.dispatch_date) OVER (ORDER BY hb.setting_date, hb.id) AS prev_dispatch
  FROM public.hatch_batches hb
  JOIN public.he_dispatch d2 ON d2.id = hb.dispatch_id
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
) x
JOIN public.he_dispatch d ON d.id = x.dispatch_id;

-- 4. The window in the screenshot, so the order can be read directly
SELECT hb.setting_date::text AS set_on, hb.hatchery_name, hb.eggs_set,
       d.invoice_no, d.dc_no, d.dispatch_date::text AS dispatched, d.total_dispatched
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND hb.setting_date BETWEEN '2025-12-28' AND '2026-01-06'
ORDER BY hb.setting_date, hb.id;
