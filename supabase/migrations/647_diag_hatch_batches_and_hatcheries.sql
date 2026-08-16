-- Diagnostic only. No schema change, no data change.
--
-- Four questions raised about Hatch Batches, answered from the real data
-- before anything is built or changed:
--
--   a) What does the Hatcheries master actually hold?
--   b) What is stored in hatch_batches.hatchery_name (free text today) --
--      does it even match the master?
--   c) Why does HE sent to Hitech not appear in the Pipeline tab? The tab
--      filters hatch_batches rows with no hatch report; it never looks at
--      he_dispatch. So the real measure is: how many dispatches have no
--      hatch batch at all.
--   d) Is there any hatchery-wise comparison possible today?

-- 1. The Hatcheries master, and whether HE Dispatch is using it.
SELECT (SELECT COUNT(*) FROM public.hatcheries) AS hatcheries_in_master,
       (SELECT string_agg(name, ', ' ORDER BY name) FROM public.hatcheries) AS hatchery_names,
       (SELECT COUNT(*) FROM public.he_dispatch) AS he_dispatch_rows,
       (SELECT COUNT(hatchery_id) FROM public.he_dispatch) AS dispatches_with_hatchery_id,
       (SELECT COUNT(*) FROM public.he_dispatch WHERE hatchery_id IS NULL) AS dispatches_without_hatchery;

-- 2. What hatch_batches actually holds, and what is in the free-text hatchery
--    field -- spelling variants included, since nothing constrains it.
SELECT COUNT(*) AS hatch_batch_rows,
       COUNT(hatchery_name) AS rows_with_hatchery_text,
       COUNT(dispatch_id) AS rows_linked_to_a_dispatch,
       COUNT(*) FILTER (WHERE hatched_chicks IS NULL) AS awaiting_hatch_in_pipeline,
       COALESCE(string_agg(DISTINCT COALESCE(hatchery_name,'(blank)'), ' | '), 'NONE') AS hatchery_text_values
FROM public.hatch_batches;

-- 3. THE PIPELINE GAP: dispatches that have no hatch batch at all. These are
--    eggs sent to a hatchery that the Pipeline tab cannot show, because the
--    tab reads hatch_batches and this dispatch has no row there.
SELECT COUNT(*) AS dispatches_with_no_hatch_batch,
       COALESCE(SUM(d.total_dispatched), 0) AS eggs_not_tracked,
       MIN(d.dispatch_date)::text AS earliest,
       MAX(d.dispatch_date)::text AS latest
FROM public.he_dispatch d
WHERE NOT EXISTS (SELECT 1 FROM public.hatch_batches b WHERE b.dispatch_id = d.id);

-- 4. The same gap by hatchery and month, most recent first -- so it is visible
--    which hatchery's eggs are untracked rather than just how many.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY mth DESC, line), 'NONE') AS untracked_by_hatchery
FROM (
  SELECT to_char(d.dispatch_date,'YYYY-MM') AS mth,
         to_char(d.dispatch_date,'YYYY-MM') || ' ' || COALESCE(h.name, '(no hatchery set)')
           || ': ' || COUNT(*) || ' dispatch(es), ' || SUM(d.total_dispatched) || ' eggs' AS line
  FROM public.he_dispatch d
  LEFT JOIN public.hatcheries h ON h.id = d.hatchery_id
  WHERE NOT EXISTS (SELECT 1 FROM public.hatch_batches b WHERE b.dispatch_id = d.id)
  GROUP BY 1, COALESCE(h.name, '(no hatchery set)')
  ORDER BY mth DESC LIMIT 15
) x;

-- 5. What a hatchery-wise comparison would have to work with today: batches
--    grouped by the free-text name, with the figures a comparison would use.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NO COMPLETED BATCHES') AS by_hatchery_today
FROM (
  SELECT COALESCE(hatchery_name,'(blank)') || ': ' || COUNT(*) || ' batch(es), set '
         || COALESCE(SUM(eggs_set),0) || ', std ' || COALESCE(SUM(std_chicks),0)
         || ', hatch% ' || COALESCE(ROUND(AVG(hatchability_pct),2), 0) AS line
  FROM public.hatch_batches
  WHERE hatched_chicks IS NOT NULL
  GROUP BY COALESCE(hatchery_name,'(blank)')
) y;
