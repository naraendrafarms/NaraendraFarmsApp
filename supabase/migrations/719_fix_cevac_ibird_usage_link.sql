-- Migration 719: link the CEVAC IBIRD usage of 30/06/2026 to Items Master.
--
-- Items Master is clean: ONE CEVAC IBIRD (code IBIRD, Vaccine, Dose), four
-- aliases all pointing at it, one medicines_master entry. No duplicate, no
-- merge leftover. The fault is a single usage entry of 72,500 doses on
-- 30/06/2026 (Flock 20) whose item_id was never set — 5 of the 6 CEVAC IBIRD
-- usages carry it, that one does not. The ledger row a usage creates takes its
-- item and its NAME from that link, so with the link missing the row was
-- written blank and reduced nothing: the vaccine reads 75,000 doses in stock
-- when 2,500 remain.
--
-- Setting the link is enough. fn_med_usage_to_stock_ledger repairs the ledger
-- row on UPDATE — item_id and item_name both come from the usage row.

UPDATE public.medicine_usage mu
SET item_id = (SELECT i.id FROM public.items i WHERE lower(i.name) = 'cevac ibird' LIMIT 1)
WHERE mu.item_id IS NULL
  AND mu.medicine_id = (SELECT m.id FROM public.medicines_master m WHERE lower(m.name) = 'cevac ibird' LIMIT 1);

SELECT 'blank_rows_left' AS chk, count(*)::int AS n
FROM public.stock_ledger WHERE COALESCE(btrim(item_name), '') = '';

SELECT 'usages_unlinked_left' AS chk, count(*)::int AS n
FROM public.medicine_usage mu
WHERE mu.item_id IS NULL
  AND mu.medicine_id = (SELECT m.id FROM public.medicines_master m WHERE lower(m.name) = 'cevac ibird' LIMIT 1);

SELECT 'balance_after' AS chk,
       round(SUM(CASE WHEN txn_type IN ('production_out','medicine_out','adjustment_out','transfer_out','dispatch_out')
                      THEN -qty ELSE qty END)::numeric, 2) AS balance_doses,
       count(*)::int AS ledger_rows
FROM public.stock_ledger
WHERE item_id = (SELECT i.id FROM public.items i WHERE lower(i.name) = 'cevac ibird' LIMIT 1);
