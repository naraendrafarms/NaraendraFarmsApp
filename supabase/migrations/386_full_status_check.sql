SELECT 'sentinel' AS marker, 1 AS n;

SELECT count(*) AS total_flock21_rows, count(*) FILTER (WHERE shed_id IS NULL) AS nhb_rows,
       min(record_date) AS from_date, max(record_date) AS to_date
FROM vhl_daily_entry v JOIN flocks fl ON fl.id = v.flock_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true;

SELECT table_name, action, changed_at, summary
FROM audit_log
ORDER BY changed_at DESC LIMIT 5;
