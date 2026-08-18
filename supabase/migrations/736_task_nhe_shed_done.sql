-- Migration 736: both halves of the NHE bird-sale fix shipped; tick it off and
-- record what is left over — 225 bird sales across all flocks carry no shed and
-- deliberately were not given one by guesswork.

UPDATE public.tasks
SET status = 'done', completed_at = now(),
    description = description || E'\n\nDONE 18/08/2026: both. (a) Bulk Daily Entry shows the day''s NHE bird sales above the grid — count, female, male and which sheds — and warns when any carry no shed, so what has already been deducted is visible whichever way it was recorded. (b) A bird sale now carries the SHED the birds left; the culls are written onto that shed''s daily record, and where the day has no record yet, the one created for it is created ON the shed instead of shed-less. Left blank the old flock-level behaviour is kept, so the 225 bird sales already entered are untouched.'
WHERE task_type = 'development'
  AND title = 'NHE bird sales do not appear in Bulk Daily Entry'
  AND status <> 'done';

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('225 old bird sales carry no shed',
   'WAITING ON YOU, IF YOU WANT IT: every bird sale entered before 18/08/2026 has no shed on it — 225 of them, including Flock 19''s 69 sales totalling 36,080 female and 3,471 male birds. Their culls sit on flock-level daily records, so the flock totals are right but no shed''s closing count reflects them. They were deliberately NOT given a shed by guesswork. If you can say which shed each batch came from, the sales can be updated and the culls moved onto those sheds'' records; otherwise they stay flock-level, which is accurate as far as it goes.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'done')::int AS done
FROM public.tasks WHERE task_type = 'development';
