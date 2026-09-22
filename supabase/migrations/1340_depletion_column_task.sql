-- INSERT only, guarded by title. No existing row is changed or deleted.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Check whether a cumulative depletion column reads 0.0% when it should not',
   'OPEN - mine to check, NOT urgent, and NOT confirmed as a fault. Noticed 22/09/2026 while reading a screenshot the owner sent for a different reason (he was showing the Actual-beside-Standard layout he wanted, not reporting a bug). In that crop a cumulative depletion column showed ACTUAL 0.0% on every row while the standard climbed 0.1% to 3.3%. MEASURED THE SAME DAY (migration 1339, read only, Errors: 0): the deaths are certainly in the data - Flock 19 carries 9,093 female deaths across 1,952 days against 45,700 placed, plus 36,289 culls, and Flock 20 carries 4,586 deaths and 168 culls against 36,919 placed. So a depletion actual of 0.0% cannot be right for either flock. WHAT WAS NOT ESTABLISHED: which screen and column it was. The crop matched Flock Lifetime on its two egg columns, but on that page the depletion pair sits BEFORE body weight and feed, while in the crop it appeared after the egg columns - so it may be a different view, or a column misread from the crop. ONE THING WORTH CHECKING EITHER WAY, FOUND WHILE LOOKING: the two pages count culls from DIFFERENT COLUMNS. Flock Lifetime reads trcull_female; the flock page vs Standard tab reads cull_female. Both cannot be right for the same quantity, and whichever is wrong would silently understate depletion on that page. Nothing was changed - this is recorded, not fixed.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT left(title, 55) AS title, status FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'Check whether a cumulative depletion%';
