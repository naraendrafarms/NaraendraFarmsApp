SELECT 'sentinel' AS marker, 1 AS n;

SELECT f.flock_no, dr.record_date, dr.he_eggs_a, dr.he_eggs_b, dr.he_eggs_c, dr.nhe_je, dr.feed_kg
FROM daily_records dr
JOIN flocks f ON f.id = dr.flock_id
WHERE f.status IN ('rearing','laying')
ORDER BY dr.record_date DESC, f.flock_no
LIMIT 20;

SELECT f.flock_no, count(*) AS total_daily_records, max(dr.record_date) AS latest_date, min(dr.record_date) AS earliest_date
FROM flocks f
LEFT JOIN daily_records dr ON dr.flock_id = f.id
WHERE f.status IN ('rearing','laying')
GROUP BY f.flock_no;
