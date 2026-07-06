SELECT 'sentinel' AS marker, 1 AS n;

SELECT id, shed_no, shed_name, farm_id, is_active
FROM sheds WHERE farm_id = 'a7883f96-fc7b-4e9b-80fd-25d45e9b1799'
ORDER BY shed_no;

SELECT id, name, code FROM farms WHERE name ILIKE '%bodjanampet%';
