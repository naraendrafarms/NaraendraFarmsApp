-- 5 rows still had a bad closing after 996 -- these are cases where two buggy
-- rows were consecutive days for the same shed: fixing day N's closing fired
-- the cascade trigger and updated day N+1's opening, but day N+1's own SET
-- clause in the same UPDATE statement was computed from its pre-cascade
-- (stale) opening. Re-running the identical fix now uses the corrected
-- opening values.
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

SELECT 'f19_f22_pass2' AS chk, count(*)::int AS rows_still_bad
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text IN ('19','22')
  AND d.trcull_female = d.transfer_female
  AND d.trcull_male = d.transfer_male
  AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  AND (d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
       OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male));
