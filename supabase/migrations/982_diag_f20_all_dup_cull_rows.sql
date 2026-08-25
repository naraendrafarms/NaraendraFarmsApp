SELECT count(*) AS n_affected_rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '20'
  AND d.trcull_female = d.transfer_female AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
    OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
