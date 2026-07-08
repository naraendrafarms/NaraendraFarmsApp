SELECT 'sentinel' AS marker, 1 AS n;

SELECT min(record_date) AS earliest, max(record_date) AS latest, count(*) AS total_rows,
       sum(feed_female_kg+feed_male_kg) AS total_feed_kg, sum(total_eggs) AS total_eggs,
       sum(he_eggs+je_eggs+te_eggs+be_eggs+le_eggs) AS sum_of_grades
FROM vhl_daily_entry;

SELECT count(*) AS rows_in_range, sum(feed_female_kg+feed_male_kg) AS feed_kg_in_range
FROM vhl_daily_entry WHERE record_date BETWEEN '2025-06-01' AND '2026-05-31';

SELECT count(*) AS rows_outside_range, sum(feed_female_kg+feed_male_kg) AS feed_kg_outside_range,
       min(record_date) AS earliest_outside, max(record_date) AS latest_outside
FROM vhl_daily_entry WHERE record_date < '2025-06-01' OR record_date > '2026-05-31';

SELECT shed_id, count(*) AS rows FROM vhl_daily_entry WHERE shed_id IS NULL GROUP BY shed_id;
