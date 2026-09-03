-- Migration 1131: log the line-wise daily entry screen as an open task.
--
-- The owner asked where to enter line-wise data in parallel with the existing
-- Bulk Daily Entry. The answer is that there is nowhere yet: shed_lines is
-- built and loaded (484 lines) and now editable at Masters -> Line Master, but
-- line_production / line_mortality / line_feed have no screen at all and are
-- empty, and sheds.line_managed is off on every shed.
--
-- Two decisions are the owner's and block the build, so this is recorded as
-- WAITING ON YOU rather than as work I can simply get on with.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Line-wise daily entry screen (parallel to Bulk Daily Entry)',
   'NOT BUILT + WAITING ON YOU. There is no screen for line-wise daily figures. '
   || 'Masters -> Line Master defines the lines only. line_production (4 egg rounds/day), '
   || 'line_mortality (F/M + reason) and line_feed (kg by feed type, F/M) all exist and are '
   || 'EMPTY, with no UI, and sheds.line_managed is OFF on every shed -- so a line entry page '
   || 'built today would open blank. '
   || 'ALREADY BUILT AND SITTING IDLE: the three tables, the shed_supervisor role and its '
   || 'permissions, the per-shed line_managed switch, and 484 loaded lines '
   || '(Kethireddypally 12 sheds / 292 lines / 24,044 boxes; Agraharam Potlapally 4 sheds / '
   || '192 lines / 24,754 boxes split F/M). '
   || 'WAITING ON YOU (1): which shed to switch line_managed ON for first. Any Kethireddypally '
   || 'shed is safe -- its boxes agree with the shed master on all 12. '
   || 'WAITING ON YOU (2): should line totals FEED the shed daily figure, or stay separate and '
   || 'merely be compared against it? Recommended: separate to start, comparison shown, nothing '
   || 'written automatically. '
   || 'CONSTRAINT: Bulk Daily Entry and Daily Entry must keep working unchanged for every shed, '
   || 'line-managed or not -- the owner has entry going on and the line view is additive. '
   || 'Grading stays at day level on daily_records; the line tables deliberately hold counts only.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
  WHERE t.title = v.title AND t.task_type = 'development'
);

-- VERIFY: the task is present exactly once, and nothing else was disturbed.
SELECT count(*)::int AS this_task,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type = 'development' AND status = 'pending') AS pending_dev_tasks
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Line-wise daily entry screen (parallel to Bulk Daily Entry)';
