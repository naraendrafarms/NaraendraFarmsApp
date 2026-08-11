-- Reconciles the master-vs-master unit conflicts 604 found, on your ruling:
--   Biospark Gold          → kg   (Item Master already said kg; Medicine Master said Ltr)
--   Dabur Gut Health Juice → Ltr  (Item Master already said Ltr; Medicine Master said ML)
-- In both cases Item Master was already correct, so only medicines_master
-- changes and the two masters then agree.
--
-- 605 deliberately skipped Biospark Gold's 31 usage rows because the two
-- masters disagreed and picking one would have silently restated a real
-- quantity. With the conflict resolved those rows can now be corrected.
-- Dabur Gut Health Juice has no usage rows yet, so nothing to repair there.
--
-- Formalin (medicine=Ltr, item=kg) is NOT touched — no ruling was given and it
-- has no usage rows, so nothing is printing wrongly today. Statement 5 keeps
-- reporting it so it cannot be forgotten.
--
-- Exactly 5 statements: run_sql.py only prints the first 5, and the UPDATEs
-- return no rows, so the two verification statements must land at 4 and 5.

-- 1. Biospark Gold: align the medicine master to Item Master's kg.
UPDATE public.medicines_master
SET unit = 'kg'
WHERE name ILIKE '%biospark%';

-- 2. Dabur Gut Health Juice: align the medicine master to Item Master's Ltr.
UPDATE public.medicines_master
SET unit = 'Ltr'
WHERE name ILIKE '%dabur%gut%';

-- 3. Repair the stored usage rows for these two, now that their masters agree.
--    Same rule as 605: Item Master first, medicine master as fallback.
UPDATE public.medicine_usage u
SET unit = COALESCE(i.unit, m.unit)
FROM public.medicines_master m
LEFT JOIN public.items i ON i.id = m.item_id
WHERE m.id = u.medicine_id
  AND (m.name ILIKE '%biospark%' OR m.name ILIKE '%dabur%gut%')
  AND COALESCE(i.unit, m.unit) IS NOT NULL
  AND u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit);

-- 4. Did it land: the two medicines, and the overall agreement count.
--    still_disagree should now be 0.
SELECT (SELECT COALESCE(string_agg(m.name || ': medicine=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.unit,'no link')
          || ' usage=' || COALESCE((SELECT string_agg(DISTINCT COALESCE(u.unit,'null'), '/')
                                    FROM public.medicine_usage u WHERE u.medicine_id = m.id), 'never used'),
          ' | ' ORDER BY m.name), 'NOT FOUND')
        FROM public.medicines_master m
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE m.name ILIKE '%biospark%' OR m.name ILIKE '%dabur%gut%') AS ruled_medicines,
       (SELECT COUNT(*) FROM public.medicine_usage) AS usage_rows_total,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS still_disagree;

-- 5. "What else is like this" — everything still needing a human decision:
--    remaining master-vs-master conflicts, medicines with no unit anywhere,
--    medicines not linked to an item, and the spelling variants in use.
SELECT (SELECT COALESCE(string_agg(m.name || ' (medicine=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.unit,'null') || ')', ' | ' ORDER BY m.name), 'NONE')
        FROM public.medicines_master m JOIN public.items i ON i.id = m.item_id
        WHERE LOWER(TRIM(m.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS master_conflicts_left,
       (SELECT COALESCE(string_agg(m.name, ', ' ORDER BY m.name), 'NONE')
        FROM public.medicines_master m LEFT JOIN public.items i ON i.id = m.item_id
        WHERE COALESCE(i.unit, m.unit) IS NULL) AS no_unit_anywhere,
       (SELECT COUNT(*) FROM public.medicines_master WHERE item_id IS NULL) AS not_linked_to_item,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.medicine_usage GROUP BY 1
        ) z) AS usage_units_now;
