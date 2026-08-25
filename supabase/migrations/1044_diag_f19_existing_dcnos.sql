SELECT string_agg(d.dc_no::text, ',' ORDER BY d.dc_no)
FROM public.he_dispatch d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '19';
