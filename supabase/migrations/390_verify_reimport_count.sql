SELECT count(*) AS total_rows FROM vhl_daily_entry v JOIN flocks fl ON fl.id = v.flock_id WHERE fl.flock_no = 21 AND fl.is_vhl_contract = true;
