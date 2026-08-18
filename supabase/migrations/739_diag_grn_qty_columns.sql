-- Migration 739: read-only. Feed Mill > Feed Stock Status builds "received"
-- from grn.qty, while the stock ledger trigger uses grn.quantity. If the entry
-- form fills only one of them, that page is reading a column nobody writes —
-- which would explain Alkakarb's 5,000 kg being on the ledger but missing
-- there. Also check 40 Degree, which was edited on 31/05/2026.

SELECT 'grn_columns' AS chk,
       COALESCE(string_agg(column_name, ', ' ORDER BY column_name), '(none)') AS qty_like_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'grn'
  AND column_name IN ('qty','quantity','category','item_id','item_name');

SELECT 'fill_rates' AS chk, count(*)::int AS grn_rows,
       count(qty)::int AS qty_filled,
       count(quantity)::int AS quantity_filled,
       count(*) FILTER (WHERE qty IS NULL AND quantity IS NOT NULL)::int AS quantity_only,
       count(*) FILTER (WHERE qty IS NOT NULL AND quantity IS NULL)::int AS qty_only
FROM public.grn;

SELECT 'alkakarb_grn' AS chk, grn_date, grn_no, item_name, qty, quantity, category, unit
FROM public.grn WHERE item_name ILIKE '%alka%';

SELECT 'forty_degree_ledger' AS chk, txn_type, count(*)::int AS rows,
       round(sum(qty)::numeric, 2) AS total_qty
FROM public.stock_ledger WHERE item_name ILIKE '%40 degree%'
GROUP BY txn_type ORDER BY txn_type;

SELECT 'forty_degree_balance' AS chk,
       round(SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                      THEN -qty ELSE qty END)::numeric, 2) AS balance_kg,
       count(*)::int AS ledger_rows
FROM public.stock_ledger WHERE item_name ILIKE '%40 degree%';
