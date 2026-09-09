-- Read-only. The owner's point: eggs sent to Hitech and eggs set in the hatch
-- batches are the SAME number, so a correct linking must reconcile dispatch by
-- dispatch, not merely in total. Migration 1223 only counted rows linked; it
-- never compared each dispatch's eggs against the eggs of the batches hung on
-- it. That comparison is what this measures, plus whether an exact split even
-- exists in the data, plus what keys the batches carry that could link them
-- better than a running-total guess.
SELECT 1 AS warmup;

-- 1. The two sides, and what identifying keys the batches actually hold
SELECT (SELECT count(*) FROM public.he_dispatch d JOIN public.parties p ON p.id = d.party_id
        WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
          AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
          AND p.name ILIKE '%hitech%')::int AS hitech_dispatches,
       (SELECT sum(d.total_dispatched) FROM public.he_dispatch d JOIN public.parties p ON p.id = d.party_id
        WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
          AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
          AND p.name ILIKE '%hitech%')::bigint AS eggs_dispatched,
       (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::int AS batches,
       (SELECT sum(eggs_set) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::bigint AS eggs_set,
       (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND invoice_no IS NOT NULL)::int AS batches_with_own_invoice_no,
       (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND setting_no IS NOT NULL)::int AS batches_with_setting_no,
       (SELECT count(DISTINCT hatchery_name) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::int AS distinct_hatchery_names;

-- 2. Does the CURRENT link reconcile per dispatch? This is the real test.
SELECT count(*)::int AS dispatches,
       count(*) FILTER (WHERE COALESCE(b.eggs,0) = d.total_dispatched)::int AS reconciles_exactly,
       count(*) FILTER (WHERE COALESCE(b.eggs,0) <> d.total_dispatched)::int AS does_not_reconcile,
       COALESCE(sum(abs(COALESCE(b.eggs,0) - d.total_dispatched)),0)::bigint AS total_eggs_out_of_place,
       COALESCE(max(abs(COALESCE(b.eggs,0) - d.total_dispatched)),0)::bigint AS worst_single_dispatch
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN (SELECT dispatch_id, sum(eggs_set)::bigint AS eggs, count(*)::int AS n
           FROM public.hatch_batches
           WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
           GROUP BY dispatch_id) b ON b.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%';

-- 3. Every dispatch that does not reconcile, in date order, so the damage is a named list
SELECT d.dispatch_date::text AS dispatch_date, d.dc_no, COALESCE(d.invoice_no,'-') AS invoice_no,
       d.total_dispatched AS dispatched, COALESCE(b.eggs,0)::bigint AS linked_eggs_set,
       COALESCE(b.n,0)::int AS batches_on_it,
       (COALESCE(b.eggs,0) - d.total_dispatched)::bigint AS diff
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN (SELECT dispatch_id, sum(eggs_set)::bigint AS eggs, count(*)::int AS n
           FROM public.hatch_batches
           WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
           GROUP BY dispatch_id) b ON b.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%'
  AND COALESCE(b.eggs,0) <> d.total_dispatched
ORDER BY d.dispatch_date, d.dc_no LIMIT 60;

-- 4. Is an exact split even possible? If every dispatch's running total is also a
--    batch running total, the eggs CAN be cut cleanly and any mismatch above is
--    my join's fault. If not, the batch sizes themselves straddle two dispatches.
WITH b AS (
  SELECT sum(eggs_set) OVER (ORDER BY setting_date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum
  FROM public.hatch_batches
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND eggs_set IS NOT NULL
),
d AS (
  SELECT dd.dispatch_date, dd.dc_no, dd.total_dispatched,
         sum(dd.total_dispatched) OVER (ORDER BY dd.dispatch_date, dd.dc_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum
  FROM public.he_dispatch dd JOIN public.parties p ON p.id = dd.party_id
  WHERE dd.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dd.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
)
SELECT count(*)::int AS dispatch_boundaries,
       count(*) FILTER (WHERE d.cum IN (SELECT cum FROM b))::int AS land_on_a_batch_boundary,
       count(*) FILTER (WHERE d.cum NOT IN (SELECT cum FROM b))::int AS straddle_a_batch
FROM d;
