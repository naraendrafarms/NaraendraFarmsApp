-- Diagnostic only. 659's first answer was cut off by the log line length at
-- "nhe_sale_lin...", so the smaller tables were never seen. Same count, split
-- into four alphabetical slices so nothing is truncated, plus the specific
-- tables sitting behind a .limit() in the app.

SELECT COALESCE(string_agg(tbl || '=' || cnt, ', ' ORDER BY tbl), 'NONE') AS a_to_e
FROM (SELECT table_name AS tbl, (xpath('/row/c/text()', query_to_xml(
        format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint AS cnt
      FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') x
WHERE cnt >= 50 AND tbl < 'f';

SELECT COALESCE(string_agg(tbl || '=' || cnt, ', ' ORDER BY tbl), 'NONE') AS f_to_m
FROM (SELECT table_name AS tbl, (xpath('/row/c/text()', query_to_xml(
        format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint AS cnt
      FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') x
WHERE cnt >= 50 AND tbl >= 'f' AND tbl < 'n';

SELECT COALESCE(string_agg(tbl || '=' || cnt, ', ' ORDER BY tbl), 'NONE') AS n_to_s
FROM (SELECT table_name AS tbl, (xpath('/row/c/text()', query_to_xml(
        format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint AS cnt
      FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') x
WHERE cnt >= 50 AND tbl >= 'n' AND tbl < 't';

SELECT COALESCE(string_agg(tbl || '=' || cnt, ', ' ORDER BY tbl), 'NONE') AS t_to_z
FROM (SELECT table_name AS tbl, (xpath('/row/c/text()', query_to_xml(
        format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text::bigint AS cnt
      FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') x
WHERE cnt >= 50 AND tbl >= 't';

-- The exact tables behind a .limit() in the app, named one by one so a missing
-- table shows as absent rather than being quietly skipped.
SELECT COALESCE(string_agg(t || '=' || COALESCE(c::text,'TABLE MISSING'), ', ' ORDER BY t), 'NONE') AS limited_tables
FROM (
  SELECT t, CASE WHEN to_regclass('public.'||t) IS NULL THEN NULL
                 ELSE (xpath('/row/c/text()', query_to_xml(
                        format('SELECT COUNT(*) AS c FROM public.%I', t), false, true, '')))[1]::text::bigint END AS c
  FROM unnest(ARRAY['generator_usage_log','generator_diesel_purchases','tasks','egg_conversions',
                    'farm_expenses','electricity_bills','feed_production','feed_transfers',
                    'feed_production_ingredients','medicine_monthly','pending_payments',
                    'purchase_orders','vendor_advances','vhl_daily_entry','vhl_egg_production',
                    'inventory_items','stock_ledger','sales_register','audit_log','attendance_daily',
                    'daily_records','cash_book','bank_transactions','trial_balance','grn',
                    'nhe_sales','he_dispatch','hatchability','hatch_batches']) AS t
) z;

-- GRN rows the Feed report actually reads (it filters category='Feed Ingredient'
-- and sits behind .limit(200) when no month is chosen).
SELECT COUNT(*)::text AS feed_ingredient_grns,
       COUNT(*) FILTER (WHERE grn_date >= CURRENT_DATE - 365)::text AS in_last_year
FROM public.grn WHERE category = 'Feed Ingredient';
