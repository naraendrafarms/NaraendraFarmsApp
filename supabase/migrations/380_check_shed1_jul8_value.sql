SELECT 'sentinel' AS marker, 1 AS n;

SELECT v.record_date, sh.shed_no, v.opening_female, v.received_female, v.closing_female, v.feed_female_kg
FROM vhl_daily_entry v
JOIN flocks fl ON fl.id = v.flock_id
JOIN sheds sh ON sh.id = v.shed_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true
  AND sh.shed_no = 1 AND v.record_date IN ('2025-07-07','2025-07-08')
ORDER BY v.record_date;
