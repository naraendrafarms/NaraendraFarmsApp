SELECT table_name, action, changed_at, summary
FROM audit_log
WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 3;
