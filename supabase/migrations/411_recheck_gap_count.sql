SELECT 'sentinel' AS marker, 1 AS n;

SELECT count(*) AS rows_in_range,
       array_agg(DISTINCT dr.record_date ORDER BY dr.record_date) AS distinct_dates
FROM daily_records dr
JOIN flocks f ON f.id = dr.flock_id
WHERE dr.record_date BETWEEN '2026-06-28' AND '2026-07-03';
