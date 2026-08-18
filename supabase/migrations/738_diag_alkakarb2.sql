-- Migration 738: read-only. 737's GRN statements printed nothing, which may
-- mean no rows or may mean the runner skipped them. Ask with counts, which
-- always return a row.

SELECT 'grn_alka' AS chk, count(*)::int AS grn_lines,
       COALESCE(sum(quantity), 0) AS total_qty,
       COALESCE(min(grn_date)::text, '-') AS first_date,
       COALESCE(max(grn_date)::text, '-') AS last_date
FROM public.grn WHERE item_name ILIKE '%alka%';

SELECT 'grn_11jun' AS chk, count(*)::int AS lines_that_day,
       COALESCE(string_agg(DISTINCT item_name, ' | '), '(none)') AS items
FROM public.grn WHERE grn_date = DATE '2026-06-11';

SELECT 'ledger_alka' AS chk, txn_type, count(*)::int AS rows,
       round(sum(qty)::numeric, 2) AS total_qty
FROM public.stock_ledger WHERE item_name ILIKE '%alka%'
GROUP BY txn_type ORDER BY txn_type;

SELECT 'ledger_alka_june' AS chk, count(*)::int AS rows_in_june,
       COALESCE(string_agg(txn_date::text || ' ' || txn_type || ' ' || qty::text, ', '), '(none)') AS detail
FROM public.stock_ledger
WHERE item_name ILIKE '%alka%'
  AND txn_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30';

SELECT 'alka_balance' AS chk,
       round(SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                      THEN -qty ELSE qty END)::numeric, 2) AS balance_kg
FROM public.stock_ledger WHERE item_name ILIKE '%alka%';
