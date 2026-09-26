-- INSERT only, guarded by title. No existing row is changed or deleted.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Code Check paging guard misses a paged read with no ORDER BY at all',
   'OPEN - mine to fix, small. Found 26/09/2026 while checking my own change against the repo''s own Code Check. THE GUARD (.github/workflows/code-check.yml, "every paged read must have a unique tie-breaker") matches the pattern .order(col).range( and fails the build when a paged read is ordered by a date alone. That is the case it was written for - the Alkakarb 5,000 kg receipt. BUT a paged read with NO .order() whatsoever does not match the pattern at all, so it passes silently, and it is just as broken: without an ORDER BY the database gives no guaranteed row order between slices, so a row can be served in two pages or in none as fetchAllPages walks the range. On a money total that means double counting or a quiet shortfall. PROOF IT IS NOT THEORETICAL: the Party Dues and Employee Dues panels on NHE Sales had exactly this shape - fetchAllPages with a select, a filter and .range(), no ordering - and the HE dispatch read I added in the same session repeated it. All three now carry .order(''id'') and were fixed in the same session this task was raised. THE FIX: extend the guard to also flag a .range( that has no .order( anywhere in the same query chain. Care needed on two points - the chain can be split across lines, and views (v_ prefix) are already exempted because they have no id, so the new check must keep that exemption. Worth doing because the guard exists precisely so this class of bug cannot reach main again, and right now half the class walks past it.',
   'Housekeeping', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'seeded=' || COUNT(*) AS guard_task
  FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'Code Check paging guard misses%';

SELECT 'openDevTotal=' || COUNT(*) AS remaining
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
