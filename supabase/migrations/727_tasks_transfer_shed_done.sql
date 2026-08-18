-- Migration 727: the shed-transfer fix shipped, so tick it off; and log the
-- gap found beside it — EDITING a transfer still adjusts nothing.

UPDATE public.tasks
SET status = 'done', completed_at = now(),
    description = description || E'\n\nDONE 18/08/2026: a transfer now moves the birds between the two sheds'' allocations as well as the daily records — spread back through the source shed''s rows, not just its newest one — and Bulk Daily Entry counts every shed a flock has been transferred into. Flock 23 backfilled: sheds 12, 6 and 5 hold 7,704 / 7,686 / 6,432 females, shed 10 is down to 6,419 and shed 11 to 8,644. Flock total unchanged at 36,885 females and 4,426 males — the birds moved, none were created or lost.'
WHERE task_type = 'development'
  AND title = 'Shed transfer does not add the destination shed to the flock'
  AND status <> 'done';

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Editing a transfer adjusts nothing behind it',
   'OPEN: recording a transfer deducts the birds from the source shed daily record and now moves the shed allocations too, and deleting one reverses both. EDITING one changes only the transfer row itself — the daily record and the allocations keep the ORIGINAL figures, so correcting a typo in a bird count leaves the sheds wrong with nothing on screen to say so. Fix: reverse the old figures and apply the new ones, the same way delete and add already do.',
   'Flocks', 'high'),
  ('Flocks 20 and 22: transfer destinations have no shed allocation',
   'WAITING ON YOUR DECISION: 17 flock/shed pairs across Flocks 20 and 22 were transferred into but never allocated. Unlike Flock 23 these already carry 700 and 484 daily records on those sheds, so the entry screens reach them and the history is intact. Writing placement rows for them now would change the "current birds" figure those screens read from the latest allocation, which is why it was NOT done with Flock 23. Say the word if you want them backfilled anyway.',
   'Flocks', 'low')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';
