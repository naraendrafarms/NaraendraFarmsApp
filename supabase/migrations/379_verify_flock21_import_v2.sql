SELECT 'sentinel' AS marker, count(*) AS n FROM flocks WHERE flock_no = 21;

SELECT count(*) AS total_rows, count(*) FILTER (WHERE shed_id IS NULL) AS nhb_rows,
       min(record_date) AS from_date, max(record_date) AS to_date
FROM vhl_daily_entry v JOIN flocks fl ON fl.id = v.flock_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true;
