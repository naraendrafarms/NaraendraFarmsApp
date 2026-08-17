-- The Weekly Performance page showed "No weekly weights recorded yet" while the
-- rows were sitting in the table. Cause: the page asked PostgREST to embed
-- flocks(...) alongside the weekly rows, and an embed needs a FOREIGN KEY to
-- follow. Migration 677 created flock_weekly_performance without one, so
-- PostgREST rejected the whole request and the page treated the empty result as
-- "no data" rather than as a failure.
--
-- The page no longer depends on the embed -- it joins the flock in the browser
-- from a list it already has -- but the foreign key belongs here anyway: it
-- stops a weekly row ever pointing at a flock that does not exist, and it makes
-- the embed available to anything built later.
--
-- ON DELETE CASCADE: deleting a flock should take its weight history with it,
-- rather than leaving orphan rows that no screen can reach.
--
-- Split into its own statement and verified below, because ADD CONSTRAINT can
-- fail silently through this runner (an error containing "already exists" is
-- reported as success).
ALTER TABLE public.flock_weekly_performance
  DROP CONSTRAINT IF EXISTS fk_fwp_flock;

ALTER TABLE public.flock_weekly_performance
  ADD CONSTRAINT fk_fwp_flock FOREIGN KEY (flock_id)
  REFERENCES public.flocks(id) ON DELETE CASCADE;

-- VERIFY: the constraint must actually be present -- green alone proves nothing.
SELECT COALESCE(string_agg(conname || ' -> ' || confrelid::regclass::text, ', '), 'NO FOREIGN KEY') AS fk_state
FROM pg_constraint
WHERE conrelid = 'public.flock_weekly_performance'::regclass AND contype = 'f';

-- And the rows are still there, with their flock numbers reachable through it.
SELECT COALESCE(string_agg('F-' || f.flock_no || ' wk' || w.week_of_age || ' ' || w.sex
       || ' = ' || w.avg_body_weight_g || 'g', ' | ' ORDER BY w.sex), 'NONE') AS rows_present
FROM public.flock_weekly_performance w JOIN public.flocks f ON f.id = w.flock_id;
