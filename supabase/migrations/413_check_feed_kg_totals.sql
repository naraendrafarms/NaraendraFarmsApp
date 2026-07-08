SELECT 'sentinel' AS marker, 1 AS n;

SELECT 'daily_records' AS source, sum(feed_female_kg + feed_male_kg) AS total_feed_kg, count(*) AS rows
FROM daily_records;

SELECT 'vhl_daily_entry' AS source, sum(feed_female_kg + feed_male_kg) AS total_feed_kg, count(*) AS rows
FROM vhl_daily_entry;

SELECT f.flock_no, f.is_vhl_contract, sum(dr.feed_female_kg + dr.feed_male_kg) AS feed_kg
FROM daily_records dr JOIN flocks f ON f.id = dr.flock_id
GROUP BY f.flock_no, f.is_vhl_contract
ORDER BY feed_kg DESC NULLS LAST
LIMIT 30;
