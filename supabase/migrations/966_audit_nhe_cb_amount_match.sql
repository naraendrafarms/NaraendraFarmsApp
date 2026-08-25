-- Audit 966 (READ ONLY): of the unlinked nhe_sales, how many have a same-date same-amount cash_book row anyway?
SELECT 'nhe_cb_amount_match' AS chk,
       'unlinked=' || COUNT(*)
       || ' with_matching_cb=' || SUM(CASE WHEN EXISTS (
             SELECT 1 FROM public.cash_book cb
             WHERE cb.entry_date = ns.sale_date
               AND ROUND(COALESCE(cb.amount,0)) = ROUND(COALESCE(ns.amount,0))) THEN 1 ELSE 0 END)
       AS rows
FROM public.nhe_sales ns
WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb2 WHERE cb2.nhe_sale_id = ns.id);
