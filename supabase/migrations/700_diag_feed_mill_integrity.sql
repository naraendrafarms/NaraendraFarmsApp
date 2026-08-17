-- Diagnostic only. The farm entered every feed production from April to
-- yesterday and wants to know whether the pages are showing all of it and
-- whether stock came down correctly. Read-only; nothing is changed.

-- 1. Production actually recorded, by month. Any month missing here is missing
--    at the source, not on the screen.
SELECT COALESCE(string_agg(mth || ': ' || n || ' batch(es) ' || ROUND(kg) || ' kg', ' | ' ORDER BY mth), 'NONE') AS production_by_month
FROM (
  SELECT to_char(date_trunc('month', production_date), 'YYYY-MM') AS mth,
         COUNT(*) AS n, SUM(COALESCE(quantity_kg,0)) AS kg
  FROM public.feed_production_log GROUP BY 1
) x;

-- 2. Totals, and how they sit against the 1,000-row response cap. Under 1,000
--    means no page could have truncated it yet.
SELECT (SELECT COUNT(*)::text FROM public.feed_production_log) AS production_batches,
       (SELECT COUNT(*)::text FROM public.feed_production_ingredients) AS ingredient_rows,
       (SELECT COUNT(*)::text FROM public.stock_ledger) AS stock_ledger_rows,
       (SELECT COUNT(DISTINCT COALESCE(item_id::text, item_name))::text FROM public.stock_ledger) AS distinct_items_in_ledger,
       (SELECT COUNT(DISTINCT COALESCE(item_id::text, item_name))::text
        FROM (SELECT item_id, item_name FROM public.stock_ledger ORDER BY item_name LIMIT 1000) c) AS items_visible_in_first_1000;

-- 3. Did production consume stock? Every batch should have a production_out in
--    the ledger. Batches with none never reduced stock at all.
SELECT COUNT(*)::text AS batches_total,
       COUNT(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.stock_ledger sl
         WHERE sl.txn_type = 'production_out' AND sl.txn_date = l.production_date
       ))::text AS batches_with_no_production_out_on_that_date
FROM public.feed_production_log l;

-- 4. Ingredient consumption recorded against production, versus what the
--    ledger took out. A large gap means stock did not come down for some of it.
SELECT (SELECT ROUND(SUM(COALESCE(quantity_kg,0)))::text FROM public.feed_production_ingredients) AS ingredients_consumed_kg,
       (SELECT ROUND(SUM(COALESCE(qty,0)))::text FROM public.stock_ledger WHERE txn_type = 'production_out') AS ledger_production_out_kg;

-- 5. Any item whose ledger balance has gone NEGATIVE -- the clearest sign that
--    consumption was recorded without the matching purchase or opening stock.
SELECT COALESCE(string_agg(item || ' = ' || ROUND(bal), ' | ' ORDER BY bal), 'NONE NEGATIVE') AS negative_balances
FROM (
  SELECT COALESCE(item_name,'(no name)') AS item,
         SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                  THEN -COALESCE(qty,0) ELSE COALESCE(qty,0) END) AS bal
  FROM public.stock_ledger GROUP BY 1
) y WHERE bal < -0.5;
