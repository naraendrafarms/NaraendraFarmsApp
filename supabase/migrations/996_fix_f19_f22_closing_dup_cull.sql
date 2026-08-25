-- Same bug as Flock 20 (migration 980): trcull duplicated verbatim into transfer
-- column caused closing to be computed by subtracting trcull twice. Recompute
-- closing as opening - trcull - mortality (single subtraction) for the 15
-- affected rows (F19: 4 rows, F22: 11 rows). Only closing_female/closing_male
-- are touched; trcull/transfer/mortality data itself is untouched. The
-- re-enabled cascade trigger will propagate the corrected closing into each
-- row's next chronological opening automatically.
UPDATE public.daily_records d
SET closing_female = d.opening_female - d.trcull_female - d.mortality_female,
    closing_male   = d.opening_male   - d.trcull_male   - d.mortality_male
FROM public.flocks fl
WHERE d.flock_id = fl.id
  AND fl.flock_no::text IN ('19','22')
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));

SELECT 'f19_f22_fixed' AS chk, count(*)::int AS rows_still_bad
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text IN ('19','22')
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
