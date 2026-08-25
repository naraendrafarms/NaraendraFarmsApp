SELECT string_agg(d.dc_no::text || ':' || to_char(d.dispatch_date,'YYYY-MM-DD') || ':' || coalesce(d.invoice_no,'null') || ':amt=' || d.amount, ' | ' ORDER BY d.dispatch_date)
FROM public.he_dispatch d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no::text = '19';
