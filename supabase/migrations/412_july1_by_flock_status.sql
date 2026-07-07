SELECT 'sentinel' AS marker, 1 AS n;

SELECT f.flock_no, f.status, count(*) AS rows_july1
FROM daily_records dr
JOIN flocks f ON f.id = dr.flock_id
WHERE dr.record_date = '2026-07-01'
GROUP BY f.flock_no, f.status
ORDER BY f.flock_no;
