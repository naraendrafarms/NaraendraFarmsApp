-- Confirmed: laying_farm_id = a7883f96-fc7b-4e9b-80fd-25d45e9b1799
-- ("Bodjanampet - 2 (VHL)") is the correct VHL signal. Check every flock at
-- this site and whether any of their dispatches already got backfilled
-- into stock_ledger (which would need reversing).
SELECT flock_no FROM public.flocks WHERE laying_farm_id = 'a7883f96-fc7b-4e9b-80fd-25d45e9b1799';

SELECT sl.item_name, COUNT(*) AS rows_to_reverse, SUM(sl.qty) AS qty_to_reverse
FROM public.stock_ledger sl
JOIN public.he_dispatch d ON d.id = sl.he_dispatch_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE sl.txn_type = 'dispatch_out' AND f.laying_farm_id = 'a7883f96-fc7b-4e9b-80fd-25d45e9b1799'
GROUP BY sl.item_name;
