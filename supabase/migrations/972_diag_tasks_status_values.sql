SELECT 'tasks_status_check' AS chk, pg_get_constraintdef(oid) AS rows
FROM pg_constraint WHERE conname = 'tasks_status_check';
