SELECT count(*)::int AS n FROM public.he_dispatch d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '19';

SELECT string_agg(d.dc_no::text || ':inv=' || coalesce(d.invoice_no,'null') || ' tds_pct=' || coalesce(d.tds_pct::text,'null'), ', ' ORDER BY d.dc_no)
FROM public.he_dispatch d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '19' AND d.dc_no IN (4109, 4110);

SELECT count(*) FILTER (WHERE d.tds_pct IS NOT NULL)::int AS with_tds,
       count(*) FILTER (WHERE d.tds_pct IS NULL)::int AS without_tds
FROM public.he_dispatch d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '19';
