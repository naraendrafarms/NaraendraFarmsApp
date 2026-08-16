-- Diagnostic only. The audit needs facts, not opinions: a .limit(500) is
-- harmless on a table holding 40 rows and silently wrong on one holding 900.
-- This counts every table that a capped query on some page reads, so each cap
-- can be judged against the data actually behind it.
--
-- Caps found in the app, for reference:
--   electricity_bills 500 / 200 / 1000 · farm_expenses 500 · egg_conversions 200
--   nhe_sales 500 (recent rates) · generator_usage_log 200
--   generator_diesel_purchases 200 · grn 200 and 100 · feed_production 100
--   feed_transfers 100 · tasks 500 · purchase_orders 500 · v_po_grn_rate 500
--   daily_records 100 (dashboard) · he_dispatch 300 · hatch_batches 200 (fixed)

SELECT (SELECT COUNT(*) FROM public.electricity_bills)          AS electricity_bills,
       (SELECT COUNT(*) FROM public.farm_expenses)              AS farm_expenses,
       (SELECT COUNT(*) FROM public.egg_conversions)            AS egg_conversions,
       (SELECT COUNT(*) FROM public.nhe_sales)                  AS nhe_sales,
       (SELECT COUNT(*) FROM public.tasks)                      AS tasks;

SELECT (SELECT COUNT(*) FROM public.generator_usage_log)        AS generator_usage_log,
       (SELECT COUNT(*) FROM public.generator_diesel_purchases) AS generator_diesel,
       (SELECT COUNT(*) FROM public.grn)                        AS grn,
       (SELECT COUNT(*) FROM public.feed_production)            AS feed_production,
       (SELECT COUNT(*) FROM public.feed_transfers)             AS feed_transfers;

SELECT (SELECT COUNT(*) FROM public.purchase_orders)            AS purchase_orders,
       (SELECT COUNT(*) FROM public.v_po_grn_rate)              AS v_po_grn_rate,
       (SELECT COUNT(*) FROM public.daily_records)              AS daily_records,
       (SELECT COUNT(*) FROM public.he_dispatch)                AS he_dispatch,
       (SELECT COUNT(*) FROM public.hatch_batches)              AS hatch_batches;

-- And the ones that already exceed a thousand, where even a paged fetch has to
-- be right about paging rather than relying on PostgREST's default.
SELECT (SELECT COUNT(*) FROM public.stock_ledger)               AS stock_ledger,
       (SELECT COUNT(*) FROM public.attendance_daily)           AS attendance_daily,
       (SELECT COUNT(*) FROM public.cash_book)                  AS cash_book,
       (SELECT COUNT(*) FROM public.medicine_usage)             AS medicine_usage,
       (SELECT COUNT(*) FROM public.he_dispatch_lines)          AS he_dispatch_lines;
