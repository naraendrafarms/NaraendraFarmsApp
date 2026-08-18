-- Migration 721: verify 720. The runner reports "already exists" and "does not
-- exist" as success, so a constraint that failed to swap or a policy that never
-- replaced the old one would have shown Errors: 0 just the same.

SELECT 'type_constraint' AS chk, pg_get_constraintdef(oid) AS def
FROM pg_constraint WHERE conname = 'tasks_task_type_check';

SELECT 'policies' AS chk, policyname,
       (qual LIKE '%development%' OR with_check LIKE '%development%') AS guards_development
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' ORDER BY policyname;

SELECT 'seeded' AS chk, count(*)::int AS development_tasks,
       count(*) FILTER (WHERE status = 'pending')::int AS pending
FROM public.tasks WHERE task_type = 'development';
