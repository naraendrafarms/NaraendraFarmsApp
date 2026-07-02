SELECT
  ft.transfer_date, ft.female_count, ft.male_count,
  fs.shed_no AS from_shed_no, ts.shed_no AS to_shed_no, ft.to_shed_id
FROM public.flock_transfers ft
JOIN public.flocks f ON f.id = ft.flock_id
LEFT JOIN public.sheds fs ON fs.id = ft.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = ft.to_shed_id
WHERE f.flock_no = 22
ORDER BY ft.transfer_date DESC LIMIT 5;
