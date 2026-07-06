-- Migration 367: diagnose why a VHL Daily Entry save didn't show in audit_log

SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'vhl_daily_entry';

SELECT count(*) AS vhl_daily_entry_rows, max(created_at) AS latest_row_created,
       (SELECT max(record_date) FROM vhl_daily_entry) AS latest_record_date
FROM vhl_daily_entry;

SELECT count(*) AS vhl_audit_rows, max(changed_at) AS latest_audit_entry
FROM audit_log WHERE table_name = 'vhl_daily_entry';

SELECT table_name, record_id, action, user_email, changed_at, summary
FROM audit_log
WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 5;
