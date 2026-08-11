-- Soya Transport Charges is kg — the transport rate is entered per kg, so the
-- GRN rows (already kg) were right and ITEM MASTER was the wrong side. Item
-- Master is the source of truth for units, so it is Item Master that moves.
-- No quantity changes; only the unit label on the item.
--
-- Diluents CDHB was corrected and merged by hand in the app; statement 2 checks
-- what it actually looks like now rather than assuming the edit landed.
--
-- Statements 3-5 are the "anything else pending like this" sweep, across
-- receipts, consumption and the masters themselves.

-- 1. Soya Transport Charges → kg.
UPDATE public.items
SET unit = 'kg'
WHERE name ILIKE '%soya%transport%';

-- 2. Diluents CDHB as it stands now: the item, any medicine entries pointing at
--    it (more than one means the merge did not complete), and its GRN rows.
SELECT (SELECT COALESCE(string_agg(name || '=' || COALESCE(unit,'null'), ', '), 'NO ITEM')
        FROM public.items WHERE name ILIKE '%diluent%' OR name ILIKE '%cdhb%') AS cdhb_item_master,
       (SELECT COALESCE(string_agg(m.name || '=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.unit,'no link')
          || ' usage=' || (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id), ' | '), 'NO MEDICINE')
        FROM public.medicines_master m LEFT JOIN public.items i ON i.id = m.item_id
        WHERE m.name ILIKE '%diluent%' OR m.name ILIKE '%cdhb%') AS cdhb_medicines,
       (SELECT COALESCE(string_agg('grn ' || COALESCE(g.grn_no,'?') || ': ' || g.qty::text
          || ' ' || COALESCE(g.unit,'null') || ' item=' || COALESCE(i.unit,'null'), ' | '), 'NO GRN')
        FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE i.name ILIKE '%diluent%' OR i.name ILIKE '%cdhb%') AS cdhb_grn;

-- 3. RECEIPTS: every GRN row still disagreeing with Item Master, across all
--    inventory, not just medicines.
SELECT COUNT(*) AS grn_rows_differing,
       COALESCE(string_agg(DISTINCT COALESCE(i.name, g.item_name,'?') || ': grn='
                || COALESCE(g.unit,'null') || ' item=' || COALESCE(i.unit,'null'), ' | '), 'NONE') AS grn_still_differing
FROM public.grn g
JOIN public.items i ON i.id = g.item_id
WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit));

-- 4. CONSUMPTION and the medicine masters: usage rows disagreeing, medicines
--    with no item link (they fall back to their own unit), and any medicine
--    whose two masters still conflict.
SELECT (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS usage_rows_differing,
       (SELECT COUNT(*) FROM public.medicines_master WHERE item_id IS NULL) AS medicines_not_linked_to_item,
       (SELECT COALESCE(string_agg(m.name || ' (medicine=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.unit,'null') || ')', ' | '), 'NONE')
        FROM public.medicines_master m JOIN public.items i ON i.id = m.item_id
        WHERE LOWER(TRIM(m.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS master_conflicts,
       (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1) d) AS medicine_duplicates;

-- 5. THE MASTERS THEMSELVES — the same classes of problem one level up, which
--    nothing has looked at yet: duplicate ITEM names, items with no unit at
--    all, and the spelling spread now in use across items and the stock ledger.
SELECT (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.items GROUP BY 1 HAVING COUNT(*) > 1) d) AS duplicate_item_names,
       (SELECT COUNT(*) FROM public.items WHERE unit IS NULL OR TRIM(unit) = '') AS items_with_no_unit,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.items GROUP BY 1) z) AS item_master_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(sl.unit,'(null)') AS u, COUNT(*) AS c
          FROM public.stock_ledger sl
          WHERE sl.item_id IN (SELECT item_id FROM public.medicines_master WHERE item_id IS NOT NULL)
          GROUP BY 1) w) AS stock_ledger_units_for_medicines;
