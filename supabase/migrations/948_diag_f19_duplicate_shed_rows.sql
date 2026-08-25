SELECT d.id, d.record_date, s.shed_no, d.opening_female, d.opening_male, d.closing_female, d.closing_male, d.remarks, d.created_at
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
LEFT JOIN public.sheds s ON s.id = d.shed_id
WHERE fl.flock_no::text = '19' AND d.record_date = '2026-05-15'
ORDER BY s.shed_no::int, d.created_at;
