-- Migration 791 (READ ONLY): the vs-Standard table reads its ACTUAL hatch %
-- from he_dispatch.hatch_pct -- a field on the dispatch row. The hatch results
-- the farm actually records now live in hatch_batches, linked to a dispatch by
-- dispatch_id. If those two are not the same place, the column is blank on the
-- page even though the hatchery data is entered. Check which it is.

SELECT 'f19_hatch' AS chk,
       (SELECT count(*) FROM public.he_dispatch d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS dispatches,
       (SELECT count(*) FROM public.he_dispatch d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19' AND d.hatch_pct IS NOT NULL) AS dispatches_with_hatch_pct,
       (SELECT count(*) FROM public.hatch_batches b
          JOIN public.he_dispatch d ON d.id = b.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS batches_linked_to_f19_dispatch,
       (SELECT count(*) FROM public.hatch_batches b
          JOIN public.he_dispatch d ON d.id = b.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19' AND b.hatchability_pct IS NOT NULL) AS batches_with_hatchability;

SELECT 'batches' AS chk,
       (SELECT count(*) FROM public.hatch_batches) AS batches_total,
       (SELECT count(*) FROM public.hatch_batches WHERE dispatch_id IS NOT NULL) AS batches_linked,
       (SELECT count(*) FROM public.hatch_batches WHERE hatchability_pct IS NOT NULL) AS batches_with_pct,
       (SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'hatch_batches') AS batch_columns;
