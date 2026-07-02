SELECT f.flock_no, f.status, ft.transfer_date, ft.female_count, ft.male_count, ft.to_shed_id,
  fs.shed_no AS from_shed_no, ts.shed_no AS to_shed_no
FROM public.flocks f
LEFT JOIN public.flock_transfers ft ON ft.flock_id = f.id
LEFT JOIN public.sheds fs ON fs.id = ft.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = ft.to_shed_id
WHERE f.flock_no = '22'
ORDER BY ft.transfer_date DESC NULLS LAST;

SELECT dr.record_date, dr.shed_id, s.shed_no, dr.opening_female, dr.opening_male,
  dr.transfer_in_female, dr.transfer_in_male, dr.closing_female, dr.closing_male
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
LEFT JOIN public.sheds s ON s.id = dr.shed_id
WHERE f.flock_no = '22' AND dr.record_date IN ('2026-06-30','2026-07-01')
ORDER BY dr.record_date, s.shed_no;
