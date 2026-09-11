-- Read-only re-check, deliberately in its own run. Migration 1230 reported all
-- 90 dispatches reconciling, but it reported that in the same run that wrote the
-- swap. This proves it persisted, and re-states the whole picture from scratch:
-- every Hitech dispatch against the eggs set on it, the over-allocation rule
-- across the entire database, and that the hatch results are as they were.
SELECT 1 AS warmup;

-- 1. The whole Flock 20 Hitech picture in one row
WITH b AS (
  SELECT dispatch_id, sum(eggs_set)::bigint AS eggs, count(*)::int AS n
  FROM public.hatch_batches
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
  GROUP BY dispatch_id
)
SELECT count(*)::int AS hitech_dispatches,
       sum(d.total_dispatched)::bigint AS eggs_dispatched,
       COALESCE(sum(b.eggs),0)::bigint AS eggs_set_linked,
       count(*) FILTER (WHERE COALESCE(b.eggs,0) = d.total_dispatched)::int AS reconcile_exactly,
       count(*) FILTER (WHERE COALESCE(b.eggs,0) <> d.total_dispatched)::int AS do_not_reconcile,
       count(*) FILTER (WHERE COALESCE(b.eggs,0) > d.total_dispatched)::int AS over_allocated,
       count(*) FILTER (WHERE b.n IS NULL)::int AS dispatches_with_no_batch,
       COALESCE(sum(b.n),0)::int AS batches_attached
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN b ON b.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%';

-- 2. Any dispatch still out, named. An empty result is the pass.
WITH b AS (
  SELECT dispatch_id, sum(eggs_set)::bigint AS eggs FROM public.hatch_batches
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
  GROUP BY dispatch_id
)
SELECT COALESCE(string_agg(d.dispatch_date::text || ' DC' || d.dc_no::text || ' carried '
       || d.total_dispatched::text || ' set ' || COALESCE(b.eggs,0)::text, '  ||  '
       ORDER BY d.dispatch_date), 'NONE - every dispatch tallies') AS still_out
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN b ON b.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%' AND COALESCE(b.eggs,0) <> d.total_dispatched;

-- 3. Flock 20's batch side, and the over-allocation rule across EVERY flock
SELECT (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::int AS f20_batches,
       (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NULL)::int AS f20_unlinked,
       (SELECT sum(eggs_set) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::bigint AS f20_eggs_set,
       (SELECT count(*) FROM public.he_dispatch d
        JOIN LATERAL (SELECT COALESCE(sum(hb.eggs_set),0) AS setts, count(*) AS n
                      FROM public.hatch_batches hb WHERE hb.dispatch_id = d.id) x ON TRUE
        WHERE x.n > 0 AND COALESCE(d.total_dispatched,0) > 0
          AND x.setts > COALESCE(d.total_dispatched,0))::int AS over_allocated_any_flock,
       (SELECT count(*) FROM public.hatch_batches hb
        JOIN public.hatch_batches_link_1222 bk ON bk.id = hb.id
        WHERE hb.eggs_set IS DISTINCT FROM bk.eggs_set
           OR hb.setting_date IS DISTINCT FROM bk.setting_date
           OR hb.hatchery_name IS DISTINCT FROM bk.hatchery_name)::int AS hatch_data_changed_since_1222;

-- 4. The two corrected dispatches, read back fresh
SELECT d.dispatch_date::text AS dispatch_date, d.dc_no, d.invoice_no, d.total_dispatched AS carried,
       COALESCE(sum(hb.eggs_set),0)::bigint AS eggs_set_on_it,
       string_agg(COALESCE(hb.hatchery_name,'?') || ' ' || hb.eggs_set::text, ' + ' ORDER BY hb.eggs_set DESC) AS batches
FROM public.he_dispatch d
LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND d.dc_no IN (4619, 4620)
GROUP BY d.dispatch_date, d.dc_no, d.invoice_no, d.total_dispatched
ORDER BY d.dc_no;
