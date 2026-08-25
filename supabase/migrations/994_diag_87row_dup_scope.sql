SELECT string_agg(
  'F' || fl.flock_no || ': total=' || cnt || ' bad_close=' || bad,
  ' | ' ORDER BY fl.flock_no
) AS rows
FROM (
  SELECT d.flock_id, count(*) AS cnt,
    sum(CASE WHEN d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
              OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male)
         THEN 1 ELSE 0 END) AS bad
  FROM public.daily_records d
  WHERE d.trcull_female = d.transfer_female
    AND d.trcull_male = d.transfer_male
    AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  GROUP BY d.flock_id
) x
JOIN public.flocks fl ON fl.id = x.flock_id;
