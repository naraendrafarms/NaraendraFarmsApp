SELECT 'sentinel' AS marker, 1 AS n;
SELECT count(*) AS total_rows FROM vhl_daily_entry;
SELECT count(*) AS flock21_rows FROM vhl_daily_entry WHERE flock_id = (SELECT id FROM flocks WHERE flock_no = 21 AND is_vhl_contract = true);
