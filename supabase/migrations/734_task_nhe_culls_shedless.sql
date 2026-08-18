-- Migration 734: log the Flock 19 finding — NHE bird sales are recorded and do
-- deduct birds, but on a row with no shed, which the Bulk Daily Entry grid
-- cannot display.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('NHE bird sales do not appear in Bulk Daily Entry',
   'OPEN — awaiting your decision. Flock 19: 69 bird sales over 10 days (29/05/2026-13/06/2026) totalling 36,080 female and 3,471 male culls. Every one of those figures sits on a daily record with NO SHED on it, and Bulk Daily Entry draws one row per shed, so none of them can be seen there. Nothing is lost — the birds were deducted and the flock total is right — but the culls are not attributed to any shed, so shed-level closing counts do not reflect the sales. Cause: when an NHE bird sale is saved, the sync writes the culls to the first existing daily record for that date, and where none exists it INSERTS one with no shed and no farm. 5 of the 10 sale days have no shed-level record at all. Options: (a) show a read-only flock-level line in the Bulk grid, which fixes the view and changes no data; (b) ask for the shed on the bird sale so culls land on the right shed; (c) both.',
   'Flocks', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending
FROM public.tasks WHERE task_type = 'development';
