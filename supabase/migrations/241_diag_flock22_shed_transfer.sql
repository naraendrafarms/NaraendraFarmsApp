SELECT dr.record_date, s.shed_no, dr.opening_female, dr.transfer_in_female, dr.transfer_female,
  dr.mortality_female, dr.cull_female, dr.closing_female
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
LEFT JOIN public.sheds s ON s.id = dr.shed_id
WHERE f.flock_no = '22' AND s.shed_no = '1' AND dr.record_date BETWEEN '2026-06-27' AND '2026-07-01'
ORDER BY dr.record_date;

SELECT ft.transfer_date, ft.female_count, fs.shed_no AS from_shed, ts.shed_no AS to_shed
FROM public.flock_transfers ft
JOIN public.flocks f ON f.id = ft.flock_id
LEFT JOIN public.sheds fs ON fs.id = ft.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = ft.to_shed_id
WHERE f.flock_no = '22' AND ts.shed_no = '1';
