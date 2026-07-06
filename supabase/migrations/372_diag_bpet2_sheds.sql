-- Migration 372: check what sheds exist for Bodjanampet-2 (Flock 21's VHL site)
-- before planning the Flock 21 Excel import (shed codes 1,2,3,4,NHB in the file).

SELECT f.id AS farm_id, f.name AS farm_name
FROM flocks fl JOIN farms f ON f.id = COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true;

SELECT s.id, s.shed_no, s.shed_name, s.farm_id, s.is_active
FROM sheds s
WHERE s.farm_id IN (
  SELECT COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
  FROM flocks fl WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true
)
ORDER BY s.shed_no;

SELECT count(*) AS existing_vhl_daily_rows_flock21
FROM vhl_daily_entry v JOIN flocks fl ON fl.id = v.flock_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true;
