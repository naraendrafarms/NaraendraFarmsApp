SELECT 'sentinel' AS marker, 1 AS n;

SELECT count(*) FILTER (WHERE category IS NOT NULL) AS with_category,
       count(*) FILTER (WHERE category IS NULL) AS without_category,
       count(*) AS total
FROM pending_payments;
