-- 1335  READ ONLY.  No INSERT, no UPDATE, no DELETE, no DDL.
--
-- The export carries ONE age column (Age @ Setting) while the screen carries
-- three (Age@Setting, Age@Prod, Egg Age). How many batches would actually be
-- affected by each gap?
--   a) batches with no flock_id of their own - the screen falls back to the
--      LINKED DISPATCH's flock for the placement date, the export does not,
--      so those come out blank in Excel;
--   b) batches with a linked dispatch - these are the ones that HAVE an
--      Age@Prod and an Egg Age on screen, and neither is in the export;
--   c) of those, how many have dispatch lines carrying a production date,
--      which is what those two columns are actually computed from.
-- One compact SELECT: the runner previews only the first five rows, truncated.

SELECT
  'total=' || COUNT(*)
  || ' | no flock_id=' || COUNT(*) FILTER (WHERE b.flock_id IS NULL)
  || ' | no flock_id but linked=' || COUNT(*) FILTER (WHERE b.flock_id IS NULL AND b.dispatch_id IS NOT NULL)
  || ' | linked to a dispatch=' || COUNT(*) FILTER (WHERE b.dispatch_id IS NOT NULL)
  || ' | linked AND dispatch has prod dates=' || COUNT(*) FILTER (
       WHERE b.dispatch_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.he_dispatch_lines l
                      WHERE l.dispatch_id = b.dispatch_id AND l.prod_date IS NOT NULL))
  || ' | setting date before placement=' || COUNT(*) FILTER (
       WHERE f.placement_date IS NOT NULL AND b.setting_date < f.placement_date)
  AS hatch_batch_age_gaps
FROM public.hatch_batches b
LEFT JOIN public.flocks f ON f.id = b.flock_id;
