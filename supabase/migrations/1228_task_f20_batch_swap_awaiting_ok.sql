-- A defect I introduced in migration 1222, found by checking the thing 1223
-- never checked, and a correction that is waiting on the owner's yes.
--
-- 1222 linked the Flock 20 batches by running total and broke ties inside a
-- setting date on hb.id - a random UUID, which carries no meaning. Three
-- batches were set on 09/04/2026 and the random order put the 50,400 Howrah
-- setting first, so it fell across the join between two invoices. Result:
-- DC 4619 has 80,640 eggs set against 60,480 carried, which is the
-- dispatch_over_allocated critical rule from migration 754, and DC 4620 has
-- only 40,320 of its 60,480.
--
-- Ordering the same-day batches so the boundary falls clean fixes both with
-- two dispatch_id values swapped and nothing else touched. Not run yet - the
-- owner decides before any row moves.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Flock 20 hatch batches - two links are wrong and DC 4619 is over-allocated',
   'OPEN - WAITING ON YOUR YES. MY MISTAKE, found on 09/09/2026 after you asked me to check the '
   || 'eggs properly instead of counting rows. '
   || 'WHAT IS WRONG: 88 of the 90 Hitech dispatches reconcile exactly - the eggs set in the batches '
   || 'hung on them equal the eggs the invoice carried. Two do not. DC 4619 of 04/04/2026 '
   || '(NF/HHF/26-27/4) carried 60,480 eggs but has 80,640 set against it, and DC 4620 of 06/04/2026 '
   || '(NF/HHF/26-27/6) carried 60,480 but has only 40,320. '
   || 'WHY IT MATTERS: more eggs set than an invoice carried is the critical health rule '
   || 'dispatch_over_allocated (migration 754). Every hatch and fertility percentage on DC 4619 is '
   || 'currently measured against 20,160 eggs that never left the farm, and DC 4620 against 20,160 too few. '
   || 'The 53,42,409 grand total is right on both sides, so only these two invoices read wrong. '
   || 'HOW I CAUSED IT: migration 1222 matched batches to dispatches on a running egg total and broke '
   || 'ties within a setting date on the row id, which is a random UUID and means nothing. Three batches '
   || 'were set on 09/04/2026 - Howrah 50,400 (setting 22-110-08), NilGanj 30,240 (25-110-09) and '
   || 'NilGanj 10,080 (25-110-10) - and the random order put the 50,400 first, straddling the join. '
   || 'THE FIX, WAITING ON YOU: swap two links and nothing else. Howrah 50,400 of 09/04/2026 moves from '
   || 'DC 4619 to DC 4620, and NilGanj 30,240 of 09/04/2026 moves from DC 4620 to DC 4619. Then '
   || 'DC 4619 holds Ruiya Top Floor 30,240 plus NilGanj 30,240 = 60,480 exactly, and DC 4620 holds '
   || 'Howrah 50,400 plus NilGanj 10,080 = 60,480 exactly, and all 90 dispatches reconcile. '
   || 'No eggs_set, no setting date, no hatchery and no hatch result is touched - only dispatch_id on '
   || 'two rows, which is the linking-only limit you set. Say go and it is one migration.',
   'Hatchery', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

SELECT count(*)::int AS open_development_tasks
FROM public.tasks WHERE task_type = 'development' AND status <> 'done';

SELECT title, priority, team, status
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Flock 20 hatch batches%';
