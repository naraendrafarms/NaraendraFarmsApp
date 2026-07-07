SELECT 'sentinel' AS marker, 1 AS n;

SELECT status, count(*) FROM flocks GROUP BY status ORDER BY count(*) DESC;

SELECT f.id, f.flock_no, f.status, f.breed, fm.name AS farm_name
FROM flocks f LEFT JOIN farms fm ON fm.id = f.farm_id
ORDER BY f.flock_no DESC
LIMIT 20;
