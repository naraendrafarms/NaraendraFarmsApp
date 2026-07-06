SELECT 'sentinel' AS marker, 1 AS n;

SELECT id, flock_no, pg_typeof(flock_no) AS flock_no_type, is_vhl_contract, laying_farm_id, rearing_farm_id
FROM flocks WHERE flock_no::text = '21';

SELECT id, name, code FROM farms WHERE name ILIKE '%bodjanampet%2%' OR code = 'BPET2';

SELECT id, shed_no, pg_typeof(shed_no) AS shed_no_type, shed_name, farm_id, is_active FROM sheds WHERE shed_no::text = '1';

SELECT * FROM vhl_daily_entry ORDER BY created_at DESC LIMIT 5;
