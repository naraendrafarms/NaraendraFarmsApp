-- Migration 746: read-only. The health check found 20 ingredient lines on
-- 31/05/2026 with no consumption in the ledger — Maize 63,108 kg, Soya DOC
-- 12,865 kg and the rest of that batch. That production was edited today, so
-- find out whether its consumption rows were removed and never rewritten.

SELECT 'may31_productions' AS chk, l.id::text AS prod_id, l.production_date,
       l.quantity_kg, l.batch_no, l.created_at
FROM public.feed_production_log l
WHERE l.production_date = DATE '2026-05-31';

SELECT 'may31_ingredients' AS chk, count(*)::int AS ingredient_lines,
       round(sum(i.quantity_kg)::numeric, 2) AS total_kg
FROM public.feed_production_ingredients i
JOIN public.feed_production_log l ON l.id = i.production_id
WHERE l.production_date = DATE '2026-05-31';

SELECT 'may31_ledger' AS chk, count(*)::int AS consumption_rows,
       round(COALESCE(sum(s.qty), 0)::numeric, 2) AS total_kg
FROM public.stock_ledger s
WHERE s.txn_type = 'production_out'
  AND s.feed_prod_id IN (SELECT id FROM public.feed_production_log WHERE production_date = DATE '2026-05-31');

-- Is it only 31/05, or does any other date have lines with no consumption?
SELECT 'missing_by_date' AS chk,
       COALESCE(string_agg(x.d || ' x' || x.n::text, ', ' ORDER BY x.d), '(none)') AS dates
FROM (
  SELECT l.production_date::text AS d, count(*)::int AS n
  FROM public.feed_production_ingredients i
  JOIN public.feed_production_log l ON l.id = i.production_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_ledger s
    WHERE s.feed_prod_id = i.production_id AND s.txn_type = 'production_out'
      AND lower(s.item_name) = lower(COALESCE(i.ingredient_name, '')))
  GROUP BY l.production_date) x;
