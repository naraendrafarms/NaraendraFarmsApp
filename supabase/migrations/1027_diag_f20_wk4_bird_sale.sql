SELECT string_agg(
  to_char(sale_date,'YYYY-MM-DD') || ' type=' || sale_type || ' qty=' || quantity,
  ' | ' ORDER BY sale_date
) AS rows
FROM public.nhe_sales ns
JOIN public.flocks fl ON fl.id = ns.flock_id
WHERE fl.flock_no::text = '20' AND ns.sale_date BETWEEN '2025-06-20' AND '2025-06-30'
  AND ns.sale_type LIKE 'bird%';
