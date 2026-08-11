-- Diagnostic only (no schema changes, no data changes).
--
-- 603 established that medicines_master.unit is well populated and that 585 of
-- 615 medicine_usage rows are wrongly stamped 'ml' by BulkDailyEntry's
-- hardcoded unit. The planned fix was to copy medicines_master.unit on save.
--
-- But the medicines picked in Bulk Daily Entry are the same things kept in
-- ITEM MASTER: migration 453 links medicines_master.item_id -> items, and
-- medicine_usage also drives stock_ledger (trigger from 154). If items.unit is
-- the unit those things are really stocked and purchased in, then copying
-- medicines_master.unit could still disagree with inventory.
--
-- So before choosing the source, measure whether the two masters agree. Five
-- statements, each aggregated to always return one row.

-- 1. Do medicines even reach an item? An unlinked medicine has no items.unit
--    to copy, so this decides whether items.unit can be the sole source.
SELECT COUNT(*) AS medicines_total,
       COUNT(item_id) AS linked_to_item,
       COUNT(*) FILTER (WHERE item_id IS NULL) AS not_linked
FROM public.medicines_master;

-- 2. The deciding count: where the two masters disagree on the unit.
SELECT COUNT(*) AS linked_medicines,
       COUNT(*) FILTER (WHERE LOWER(TRIM(m.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS unit_differs,
       COUNT(*) FILTER (WHERE m.unit IS DISTINCT FROM i.unit) AS differs_incl_casing
FROM public.medicines_master m
JOIN public.items i ON i.id = m.item_id;

-- 3. Name them, so the disagreements can be judged rather than assumed away.
SELECT COALESCE(string_agg(m.name || ': medicine=' || COALESCE(m.unit,'(null)') ||
                           ' item=' || COALESCE(i.unit,'(null)'), ' | ' ORDER BY m.name), 'NONE — they all agree') AS disagreements
FROM public.medicines_master m
JOIN public.items i ON i.id = m.item_id
WHERE LOWER(TRIM(m.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit));

-- 4. The five medicines from the Daily Summary the question was about.
SELECT COALESCE(string_agg(m.name || ' → medicine=' || COALESCE(m.unit,'(null)') ||
                           ' item=' || COALESCE(i.unit,'(no item link)'), ' | ' ORDER BY m.name), 'NONE MATCHED') AS reported_medicines
FROM public.medicines_master m
LEFT JOIN public.items i ON i.id = m.item_id
WHERE m.name ILIKE '%fertimax%' OR m.name ILIKE '%vitalosin%' OR m.name ILIKE '%bvclo%'
   OR m.name ILIKE '%eveect%' OR m.name ILIKE '%biospark%';

-- 5. What units the stock ledger already carries for these consumption rows —
--    the wrong 'ml' may have been written into inventory as well, in which case
--    the backfill has to reach further than medicine_usage.
SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS stock_ledger_units_for_medicine
FROM (
  SELECT COALESCE(sl.unit,'(null)') AS u, COUNT(*) AS c
  FROM public.stock_ledger sl
  WHERE sl.item_id IN (SELECT item_id FROM public.medicines_master WHERE item_id IS NOT NULL)
  GROUP BY 1
) z;
