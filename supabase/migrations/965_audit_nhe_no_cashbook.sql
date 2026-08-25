-- Audit 965 (READ ONLY): nhe_sales with no linked cash_book row, by month and sale_type.
SELECT 'nhe_without_cb' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT to_char(ns.sale_date,'YYYY-MM') || ' n=' || COUNT(*) || ' amt=' || ROUND(SUM(COALESCE(ns.amount,0))) AS txt
  FROM public.nhe_sales ns
  WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = ns.id)
  GROUP BY to_char(ns.sale_date,'YYYY-MM')
) t;
