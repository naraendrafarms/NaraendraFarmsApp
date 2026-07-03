-- Confirmed (migration 310): 9 he_dispatch rows have non-zero box/tray
-- values but 0 'dispatch_out' stock_ledger rows exist — the trigger
-- (296/305) only applies going forward, existing dispatches were never
-- backfilled (unlike GRN, which got an explicit backfill in migration 154).
-- One-time backfill using the same item names as the corrected trigger.

INSERT INTO public.stock_ledger
  (txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
SELECT d.dispatch_date, 'dispatch_out', i.id, '20 LB Corrugated Boxes', d.boxes_20lb, 'Nos',
       d.id, d.flock_id, f.laying_farm_id, d.dc_no::TEXT
FROM public.he_dispatch d
JOIN public.items i ON i.name = '20 LB Corrugated Boxes'
LEFT JOIN public.flocks f ON f.id = d.flock_id
WHERE COALESCE(d.boxes_20lb, 0) > 0;

INSERT INTO public.stock_ledger
  (txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
SELECT d.dispatch_date, 'dispatch_out', i.id, 'Egg Box 23LB', d.boxes_23lb, 'Nos',
       d.id, d.flock_id, f.laying_farm_id, d.dc_no::TEXT
FROM public.he_dispatch d
JOIN public.items i ON i.name = 'Egg Box 23LB'
LEFT JOIN public.flocks f ON f.id = d.flock_id
WHERE COALESCE(d.boxes_23lb, 0) > 0;

INSERT INTO public.stock_ledger
  (txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
SELECT d.dispatch_date, 'dispatch_out', i.id, '20 LB Pulp Paper Egg Trays', d.extra_trays_20lb, 'Nos',
       d.id, d.flock_id, f.laying_farm_id, d.dc_no::TEXT
FROM public.he_dispatch d
JOIN public.items i ON i.name = '20 LB Pulp Paper Egg Trays'
LEFT JOIN public.flocks f ON f.id = d.flock_id
WHERE COALESCE(d.extra_trays_20lb, 0) > 0;

INSERT INTO public.stock_ledger
  (txn_date, txn_type, item_id, item_name, qty, unit, he_dispatch_id, flock_id, farm_id, reference_no)
SELECT d.dispatch_date, 'dispatch_out', i.id, '23 LB Pulp Paper Egg Trays', d.extra_trays_23lb, 'Nos',
       d.id, d.flock_id, f.laying_farm_id, d.dc_no::TEXT
FROM public.he_dispatch d
JOIN public.items i ON i.name = '23 LB Pulp Paper Egg Trays'
LEFT JOIN public.flocks f ON f.id = d.flock_id
WHERE COALESCE(d.extra_trays_23lb, 0) > 0;

-- Verify: total consumption per packaging item
SELECT item_name, COUNT(*) AS dispatch_count, SUM(qty) AS total_qty
FROM public.stock_ledger
WHERE txn_type = 'dispatch_out'
GROUP BY item_name
ORDER BY item_name;
