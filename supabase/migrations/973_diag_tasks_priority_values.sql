SELECT 'tasks_priority_check' AS chk, pg_get_constraintdef(oid) AS rows
FROM pg_constraint WHERE conname = 'tasks_priority_check';
