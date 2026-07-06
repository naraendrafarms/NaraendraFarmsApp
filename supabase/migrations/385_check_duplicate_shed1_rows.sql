-- Migration 385: check for duplicate Shed 1 rows on 2025-07-08 for Flock 21
-- (Fable's hypothesis for the earlier 3490 vs 1490 display discrepancy —
-- two shed records both numbered shed_no=1 would cause the import's JOIN to
-- insert two rows, and the UI vs our verification SELECTs could then read
-- different ones depending on which shed_id each matches).

SELECT v.id, v.shed_id, sh.shed_no, sh.shed_name, sh.is_active,
       v.opening_female, v.received_female, v.closing_female, v.feed_female_kg
FROM vhl_daily_entry v
JOIN flocks fl ON fl.id = v.flock_id
LEFT JOIN sheds sh ON sh.id = v.shed_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true AND v.record_date = '2025-07-08';

SELECT id, shed_no, shed_name, farm_id, is_active FROM sheds WHERE shed_no = 1;
