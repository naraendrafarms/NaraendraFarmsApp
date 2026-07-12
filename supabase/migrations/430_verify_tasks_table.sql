-- Migration 429 reported Errors: 0 but printed no per-statement output at all
-- (unusual — normally at least the sentinel prints). Verify directly rather
-- than trust the log, per today's earlier lesson about silent failures.
SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='tasks';

SELECT count(*) AS column_count FROM information_schema.columns
WHERE table_schema='public' AND table_name='tasks';

SELECT count(*) AS policy_count FROM pg_policy WHERE polrelid = 'public.tasks'::regclass;

INSERT INTO tasks (title, task_type, status) VALUES ('Diagnostic test task', 'admin', 'pending');
SELECT count(*) AS test_row_exists FROM tasks WHERE title = 'Diagnostic test task';
DELETE FROM tasks WHERE title = 'Diagnostic test task';
