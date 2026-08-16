-- Diagnostic only. 654's first two statements printed nothing in the job log
-- (its statements 3 and 4 printed normally), so those counts were never
-- actually seen. Asked again, one table per statement, so a vanished result
-- cannot be mistaken for a small number.

SELECT COUNT(*)::text AS electricity_bills FROM public.electricity_bills;

SELECT COUNT(*)::text AS farm_expenses FROM public.farm_expenses;

SELECT COUNT(*)::text AS nhe_sales, COUNT(*) FILTER (WHERE sale_type = 'bird_sale')::text AS bird_sales
FROM public.nhe_sales;

SELECT COUNT(*)::text AS grn, (SELECT COUNT(*)::text FROM public.feed_production) AS feed_production,
       (SELECT COUNT(*)::text FROM public.feed_transfers) AS feed_transfers
FROM public.grn;

SELECT (SELECT COUNT(*)::text FROM public.tasks) AS tasks,
       (SELECT COUNT(*)::text FROM public.egg_conversions) AS egg_conversions,
       (SELECT COUNT(*)::text FROM public.generator_usage_log) AS generator_usage_log,
       (SELECT COUNT(*)::text FROM public.generator_diesel_purchases) AS generator_diesel,
       (SELECT COUNT(*)::text FROM public.hatch_batches) AS hatch_batches_now;
