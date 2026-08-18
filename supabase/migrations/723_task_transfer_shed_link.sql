-- Migration 723: log the Flock 23 shed-transfer finding as a development task,
-- so it is on the Tasks page rather than only in a chat message.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Shed transfer does not add the destination shed to the flock',
   'OPEN — awaiting your decision on the fix. Flock 23, 17/08/2026: four transfers were recorded within Kethireddypally, shed 10 into sheds 12, 6 and 5. Recording a transfer writes flock_transfers and deducts the birds from the SOURCE shed daily record, but it never tells the flock it now occupies the destination shed. Bulk Daily Entry builds its shed list from flock_sheds (empty for this flock), then shed_allocations (only sheds 10 and 11), so sheds 5, 6 and 12 — where the birds actually are — cannot be entered against. Two parts to the fix: (1) a transfer should create or update the destination shed allocation with the birds moved, and (2) Bulk Daily Entry should also count any shed the flock has ever transferred into, so past transfers are covered without re-entering them.',
   'Flocks', 'high')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'dev_tasks' AS chk, count(*)::int AS n,
       count(*) FILTER (WHERE status = 'pending')::int AS pending
FROM public.tasks WHERE task_type = 'development';
