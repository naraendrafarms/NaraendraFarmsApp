-- Delete the 394 hatch batches whose dates were lost by the import bug.
--
-- Why these rows and no others: the importer could not read Excel date cells,
-- so every imported row took today() as its setting date and lost its hatch
-- date entirely. Migration 651 measured it exactly --
--   setting_date_spread: 2026-08-16 x 394 | 2026-07-22 x 1
--   batches_total 395, setting_date_is_today 394, with_hatch_date 1
-- so setting_date = 2026-08-16 identifies the bad import precisely, and the one
-- genuine batch (Paridhi, 22/07/2026) is NOT among them and must survive.
--
-- The date is written as a literal rather than CURRENT_DATE on purpose: if this
-- file is ever re-run on another day, a literal deletes nothing, while
-- CURRENT_DATE would delete that day's real work.
--
-- The sheet is re-imported afterwards with the fixed importer.

-- 1. Count what is about to go, BEFORE deleting -- if this is not 394, the
--    assumption is wrong and the delete below is not what was agreed.
SELECT COUNT(*) AS about_to_delete,
       COUNT(hatch_date) AS of_which_have_a_hatch_date,
       (SELECT COUNT(*) FROM public.hatch_batches) AS total_before
FROM public.hatch_batches WHERE setting_date = DATE '2026-08-16';

-- 2. The delete itself.
DELETE FROM public.hatch_batches WHERE setting_date = DATE '2026-08-16';

-- 3. What is left: should be the single genuine batch.
SELECT COUNT(*) AS total_after,
       COUNT(*) FILTER (WHERE setting_date = DATE '2026-08-16') AS misdated_left_should_be_zero,
       COALESCE(string_agg(setting_date::text || ' ' || COALESCE(hatchery_name,'(no hatchery)')
                || ' ' || COALESCE(eggs_set::text,'?') || ' eggs', ' | '), 'NONE') AS remaining_batches
FROM public.hatch_batches;

-- 4. Nothing else was touched: the hatchery master and the dispatches are
--    exactly as they were, so the re-import will still link by name.
SELECT (SELECT COUNT(*) FROM public.hatcheries) AS hatcheries_in_master,
       (SELECT COUNT(*) FROM public.hatcheries WHERE provides_hatch_report) AS ticked_as_reporting,
       (SELECT COUNT(*) FROM public.he_dispatch) AS he_dispatches,
       (SELECT COUNT(*) FROM public.he_dispatch_lines) AS he_dispatch_lines;
