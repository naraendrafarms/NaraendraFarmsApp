SELECT string_agg(
  to_char(ns.sale_date,'YYYY-MM-DD') || ' sex=' || COALESCE(ns.bird_sex,'null') ||
  ' qty=' || ns.quantity || ' dc=' || COALESCE(ns.dc_no,'') ||
  ' shed=' || COALESCE(s.shed_no::text,'none'),
  ' | ' ORDER BY ns.sale_date
) AS rows
FROM public.nhe_sales ns
JOIN public.flocks fl ON fl.id = ns.flock_id
LEFT JOIN public.sheds s ON s.id = ns.shed_id
WHERE fl.flock_no::text = '20'
  AND ns.sale_date BETWEEN (fl.placement_date + 7*23) AND (fl.placement_date + 7*31 - 1)
  AND (ns.sale_type LIKE 'bird%' OR ns.sale_type = 'bird_sale');
