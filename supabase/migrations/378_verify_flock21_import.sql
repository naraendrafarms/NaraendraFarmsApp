SELECT shed_id IS NULL AS is_nhb, count(*) AS rows, min(record_date) AS from_date, max(record_date) AS to_date
FROM vhl_daily_entry v JOIN flocks fl ON fl.id = v.flock_id
WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true GROUP BY 1;
