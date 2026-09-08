-- Verification for 1222.
SELECT 1 AS warmup;

-- 1. Every Flock 20 batch should now carry a dispatch, and the eggs should tally
SELECT count(*)::int AS batches,
       count(*) FILTER (WHERE dispatch_id IS NOT NULL)::int AS linked,
       count(*) FILTER (WHERE dispatch_id IS NULL)::int AS still_unlinked,
       COALESCE(sum(eggs_set),0)::bigint AS eggs_set_total
FROM public.hatch_batches
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

-- 2. The rule's own check: it must reproduce the link the owner made by hand.
--    That batch was left alone, so this compares it against what the walk gives.
SELECT hb.hatchery_name, hb.setting_date::text, hb.eggs_set,
       d.dc_no, d.dispatch_date::text, d.invoice_no, d.total_dispatched
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
ORDER BY hb.setting_date LIMIT 6;

-- 3. Do the batches under each dispatch add up to what that dispatch sent
SELECT CASE WHEN t.batch_eggs = t.total_dispatched THEN 'batches equal the dispatch'
            WHEN t.batch_eggs <  t.total_dispatched THEN 'batches short of the dispatch'
            ELSE 'batches exceed the dispatch' END AS verdict,
       count(*)::int AS dispatches,
       sum(t.batch_eggs)::bigint AS batch_eggs,
       sum(t.total_dispatched)::bigint AS dispatched
FROM (
  SELECT d.id, d.total_dispatched, COALESCE(sum(hb.eggs_set),0) AS batch_eggs
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
  LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
  WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
  GROUP BY d.id, d.total_dispatched
) t GROUP BY 1 ORDER BY 2 DESC;

-- 4. Every one of the 90 dispatches should now have at least one batch
SELECT count(*)::int AS hitech_dispatches,
       count(*) FILTER (WHERE t.batches > 0)::int AS with_a_batch,
       count(*) FILTER (WHERE t.batches = 0)::int AS with_none,
       sum(t.batches)::int AS batches_attached
FROM (
  SELECT d.id, count(hb.id)::int AS batches
  FROM public.he_dispatch d
  JOIN public.parties p ON p.id = d.party_id
  LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
  WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
  GROUP BY d.id
) t;
