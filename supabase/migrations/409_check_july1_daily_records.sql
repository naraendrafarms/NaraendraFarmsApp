SELECT 'sentinel' AS marker, 1 AS n;

SELECT f.flock_no, dr.record_date, dr.he_eggs_a, dr.he_eggs_b, dr.he_eggs_c, dr.nhe_je, dr.feed_kg, dr.female_alive
FROM daily_records dr
JOIN flocks f ON f.id = dr.flock_id
WHERE dr.record_date = '2026-07-01'
ORDER BY f.flock_no;

SELECT record_date, pg_typeof(record_date) AS col_type FROM daily_records LIMIT 1;
