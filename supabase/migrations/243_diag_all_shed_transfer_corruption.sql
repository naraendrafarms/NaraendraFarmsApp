SELECT count(*) AS suspect_rows FROM (
  SELECT ft.id
  FROM public.flock_transfers ft
  LEFT JOIN public.daily_records dr
    ON dr.flock_id = ft.flock_id AND dr.record_date = ft.transfer_date
    AND dr.shed_id IS NOT DISTINCT FROM ft.to_shed_id
  WHERE ft.to_shed_id IS NOT NULL
    AND (
      (ft.female_count > 0 AND COALESCE(dr.transfer_female,0) >= ft.female_count)
      OR (ft.male_count > 0 AND COALESCE(dr.transfer_male,0) >= ft.male_count)
    )
) t;

SELECT
  f.flock_no, ft.transfer_date, ft.female_count, ft.male_count,
  fs.shed_no AS from_shed, ts.shed_no AS to_shed,
  dr.transfer_female AS dest_out_female, dr.transfer_in_female AS dest_in_female,
  dr.closing_female AS dest_closing_female
FROM public.flock_transfers ft
JOIN public.flocks f ON f.id = ft.flock_id
LEFT JOIN public.sheds fs ON fs.id = ft.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = ft.to_shed_id
LEFT JOIN public.daily_records dr
  ON dr.flock_id = ft.flock_id AND dr.record_date = ft.transfer_date
  AND dr.shed_id IS NOT DISTINCT FROM ft.to_shed_id
WHERE ft.to_shed_id IS NOT NULL
  AND (
    (ft.female_count > 0 AND COALESCE(dr.transfer_female,0) >= ft.female_count)
    OR (ft.male_count > 0 AND COALESCE(dr.transfer_male,0) >= ft.male_count)
  )
ORDER BY ft.transfer_date DESC;
