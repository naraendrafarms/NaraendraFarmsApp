-- Audit 957 (READ ONLY): cash_book vs nhe_sales / he_dispatch linkage.
SELECT 'cashbook_sync' AS chk,
  'nhe_sales_total=' || (SELECT COUNT(*) FROM public.nhe_sales)
  || ' nhe_without_cb=' || (SELECT COUNT(*) FROM public.nhe_sales ns WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = ns.id))
  || ' nhe_dupe_cb=' || (SELECT COUNT(*) FROM (SELECT nhe_sale_id FROM public.cash_book WHERE nhe_sale_id IS NOT NULL GROUP BY nhe_sale_id HAVING COUNT(*)>1) x)
  || ' cb_orphan_nhe=' || (SELECT COUNT(*) FROM public.cash_book cb WHERE cb.nhe_sale_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.nhe_sales ns WHERE ns.id = cb.nhe_sale_id))
  || ' hed_dupe_cb=' || (SELECT COUNT(*) FROM (SELECT he_dispatch_id FROM public.cash_book WHERE he_dispatch_id IS NOT NULL GROUP BY he_dispatch_id HAVING COUNT(*)>1) x)
  || ' cb_orphan_hed=' || (SELECT COUNT(*) FROM public.cash_book cb WHERE cb.he_dispatch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.he_dispatch hd WHERE hd.id = cb.he_dispatch_id))
  AS rows;
