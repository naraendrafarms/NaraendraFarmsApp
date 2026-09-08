-- Read-only. The owner linked one Flock 20 batch by hand and wants the other 89
-- created the same way, egg figures only, hatch results left untouched. Copy
-- that row's conventions exactly rather than guessing them.
SELECT 1 AS warmup;

-- 1. The batch already linked, beside the dispatch it points at
SELECT hb.hatchery_name, hb.invoice_no, hb.setting_date::text, hb.eggs_set,
       hb.broken_transit, hb.fertile_eggs, hb.hatched_chicks, hb.unhatched,
       hb.hatch_date::text, hb.fertility_pct, hb.hatchability_pct, hb.remarks,
       d.dc_no, d.dispatch_date::text, d.prod_date::text,
       d.total_dispatched, d.invoice_eggs, d.free_eggs, d.invoice_no AS d_invoice
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

-- 2. Any Flock 20 batch NOT linked to a dispatch, so none is missed
SELECT count(*)::int AS unlinked_f20_batches,
       COALESCE(string_agg(DISTINCT hatchery_name, ', '), '(none)') AS hatcheries
FROM public.hatch_batches
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NULL;

-- 3. How the 14 Flock 19 batches were shaped, as a second reference
SELECT hb.hatchery_name, count(*)::int AS batches,
       count(*) FILTER (WHERE hb.eggs_set = d.total_dispatched)::int AS eggs_set_is_total_dispatched,
       count(*) FILTER (WHERE hb.eggs_set = d.invoice_eggs)::int AS eggs_set_is_invoice_eggs,
       count(*) FILTER (WHERE hb.setting_date = d.dispatch_date)::int AS setting_is_dispatch_date
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
GROUP BY 1;

-- 4. The 90 Hitech dispatches that the batches would be built from
SELECT count(*)::int AS dispatches, sum(d.total_dispatched)::bigint AS eggs,
       count(*) FILTER (WHERE hb.id IS NOT NULL)::int AS already_have_a_batch
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%';
