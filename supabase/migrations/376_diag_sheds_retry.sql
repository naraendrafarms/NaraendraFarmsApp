-- Migration 376: retry with a sentinel to distinguish "genuinely 0 results"
-- from "the query-runner silently ate the response" (which has happened
-- repeatedly with 372's COUNT(*) query — a bare aggregate can NEVER return
-- 0 rows, so getting none back means the API call itself failed silently).

SELECT 'sentinel' AS marker, count(*) AS n FROM flocks WHERE flock_no = 21;

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
