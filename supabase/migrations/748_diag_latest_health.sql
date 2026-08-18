-- Migration 748: read-only. The latest health check run, straight from the
-- table the app reads — including whether 31/05/2026 is now repaired.

SELECT 'latest_run' AS chk, max(run_at)::text AS run_at,
       count(*)::int AS rules,
       count(*) FILTER (WHERE failed_count > 0)::int AS failing
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results);

SELECT 'results' AS chk, severity, title, failed_count
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results)
ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, title;

SELECT 'may31_now' AS chk,
       (SELECT count(*)::int FROM public.feed_production_ingredients i
        JOIN public.feed_production_log l ON l.id = i.production_id
        WHERE l.production_date = DATE '2026-05-31') AS ingredient_lines,
       (SELECT count(*)::int FROM public.stock_ledger s
        WHERE s.txn_type = 'production_out'
          AND s.feed_prod_id IN (SELECT id FROM public.feed_production_log WHERE production_date = DATE '2026-05-31')) AS consumption_rows,
       (SELECT round(COALESCE(sum(s.qty),0)::numeric, 2) FROM public.stock_ledger s
        WHERE s.txn_type = 'production_out'
          AND s.feed_prod_id IN (SELECT id FROM public.feed_production_log WHERE production_date = DATE '2026-05-31')) AS consumption_kg;

SELECT 'repaired_rows' AS chk, count(*)::int AS rows,
       round(COALESCE(sum(qty),0)::numeric, 2) AS kg
FROM public.stock_ledger WHERE remarks LIKE 'Repaired 18/08/2026%';

SELECT 'alkakarb_now' AS chk,
       round(SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                      THEN -qty ELSE qty END)::numeric, 2) AS balance_kg
FROM public.stock_ledger WHERE item_name ILIKE '%alka%';
