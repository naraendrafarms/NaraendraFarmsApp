-- Migration 212: read-only single-row state check (avoids the runner's multi-SELECT
-- display quirk). Tells us if production ingredients exist and if consumption was written.
SELECT 'state' AS chk,
  (SELECT COUNT(*) FROM public.feed_production_ingredients) AS total_ing_rows,
  (SELECT COUNT(*) FROM public.feed_production_ingredients pi
     JOIN public.feed_production_log l ON l.id = pi.production_id) AS linked_ing_rows,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_rows,
  (SELECT COALESCE(SUM(qty),0) FROM public.stock_ledger WHERE txn_type='production_out') AS prod_out_kg;
