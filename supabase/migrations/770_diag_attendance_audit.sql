-- Migration 770 (READ ONLY): before changing the audit trigger, find out what
-- shape the 444,617 attendance entries actually are. If they are UPDATEs that
-- change nothing, skipping them is the fix. If they are INSERT/DELETE pairs
-- (a grid that wipes and rewrites the month), skipping no-change updates would
-- do nothing at all and the fix has to be different.

SELECT 'attendance_audit' AS chk,
       count(*) FILTER (WHERE action = 'INSERT') AS inserts,
       count(*) FILTER (WHERE action = 'UPDATE') AS updates,
       count(*) FILTER (WHERE action = 'DELETE') AS deletes,
       count(*) FILTER (WHERE action = 'UPDATE'
                          AND old_data IS NOT NULL
                          AND (old_data - 'updated_at' - 'created_at')
                            = (new_data - 'updated_at' - 'created_at')) AS updates_that_changed_nothing,
       count(*) FILTER (WHERE action = 'UPDATE' AND old_data IS NOT NULL) AS updates_with_values
FROM public.audit_log
WHERE table_name = 'attendance_daily';
