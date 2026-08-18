-- Migration 737: read-only. Alkakarb 5,000 kg was received on 11/06/2026 but
-- Inventory does not show the stock. Find where the chain breaks: the GRN row,
-- the Items Master entry, the aliases, and the stock ledger.

SELECT 'grn' AS chk, g.grn_date, g.grn_no, g.item_name, g.quantity, g.unit, g.unit_price,
       g.item_id::text AS item_id, g.nature, COALESCE(p.name, g.vendor_name, '(none)') AS supplier
FROM public.grn g LEFT JOIN public.parties p ON p.id = g.party_id
WHERE g.item_name ILIKE '%alka%'
ORDER BY g.grn_date;

SELECT 'items_master' AS chk, i.id::text AS item_id, i.name, i.code, i.category, i.unit, i.is_active
FROM public.items i WHERE i.name ILIKE '%alka%';

SELECT 'aliases' AS chk, a.alias, COALESCE(i.name, '(points nowhere)') AS points_to
FROM public.item_aliases a LEFT JOIN public.items i ON i.id = a.item_id
WHERE a.alias ILIKE '%alka%';

SELECT 'ledger' AS chk, sl.txn_date, sl.txn_type, sl.item_name, sl.qty, sl.unit,
       (sl.item_id IS NULL) AS unlinked, (sl.grn_id IS NOT NULL) AS from_grn
FROM public.stock_ledger sl
WHERE sl.item_name ILIKE '%alka%'
ORDER BY sl.txn_date;

-- Any GRN line at all on that date, in case the item is spelt differently.
SELECT 'grn_that_day' AS chk, g.grn_no, g.item_name, g.quantity, g.unit,
       EXISTS (SELECT 1 FROM public.stock_ledger s WHERE s.grn_id = g.id) AS reached_stock
FROM public.grn g WHERE g.grn_date = DATE '2026-06-11'
ORDER BY g.item_name;
