-- Read-only. Correction to 1218: the Hatch Batches page reads hatch_batches
-- (migration 048), which links to he_dispatch by dispatch_id. hatchability is a
-- different, older table. Measure the right one for Flock 20.
SELECT 1 AS warmup;

-- 1. What hatch_batches holds for Flock 20
SELECT count(*)::int AS batches,
       COALESCE(sum(eggs_set),0)::bigint AS eggs_set,
       COALESCE(sum(hatched_chicks),0)::bigint AS chicks,
       count(*) FILTER (WHERE dispatch_id IS NULL)::int AS not_linked_to_a_dispatch,
       count(*) FILTER (WHERE hatched_chicks IS NULL)::int AS no_hatch_report_yet,
       COALESCE(min(setting_date)::text,'-') || ' -> ' || COALESCE(max(setting_date)::text,'-') AS span,
       COALESCE(string_agg(DISTINCT hatchery_name, ', '), '(none)') AS hatcheries
FROM public.hatch_batches
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

-- 2. The 90 Hitech dispatches in the window against batches that exist for them
SELECT count(*)::int AS hitech_dispatches,
       sum(d.total_dispatched)::bigint AS eggs_sent,
       count(hb.id)::int AS dispatches_with_a_batch,
       count(*) FILTER (WHERE hb.id IS NULL)::int AS dispatches_with_NO_batch
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%';

-- 3. Across every flock, so the gap is not mistaken for a Flock 20 problem
SELECT COALESCE(fl.flock_no::text,'(none)') AS flock,
       count(DISTINCT d.id)::int AS he_dispatches,
       count(DISTINCT hb.id)::int AS hatch_batches
FROM public.he_dispatch d
LEFT JOIN public.flocks fl ON fl.id = d.flock_id
LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- 4. Whole table, so its real size and shape are known
SELECT count(*)::int AS all_batches,
       count(*) FILTER (WHERE dispatch_id IS NOT NULL)::int AS linked,
       count(*) FILTER (WHERE hatched_chicks IS NOT NULL)::int AS with_hatch_report,
       COALESCE(string_agg(DISTINCT hatchery_name, ', '), '(none)') AS hatcheries
FROM public.hatch_batches;
