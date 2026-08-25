UPDATE public.daily_records d
SET closing_female = d.opening_female - d.trcull_female - d.mortality_female,
    closing_male   = d.opening_male   - d.trcull_male   - d.mortality_male
FROM public.flocks fl
WHERE d.flock_id = fl.id
  AND fl.flock_no::text = '22'
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));

SELECT 'f22_pass_a' AS chk, count(*)::int AS rows_still_bad
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '22'
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));

UPDATE public.daily_records d
SET closing_female = d.opening_female - d.trcull_female - d.mortality_female,
    closing_male   = d.opening_male   - d.trcull_male   - d.mortality_male
FROM public.flocks fl
WHERE d.flock_id = fl.id
  AND fl.flock_no::text = '22'
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));

SELECT 'f22_pass_b' AS chk, count(*)::int AS rows_still_bad
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '22'
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
