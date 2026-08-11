-- Repairs medicine_usage.unit, which BulkDailyEntry hardcoded to 'ml' on every
-- save. 603 measured the damage: 585 of 615 usage rows carry 'ml' against a
-- medicine whose master says otherwise, spanning 2025-11-09 to 2026-08-10.
-- Daily Summary prints `${quantity}${unit}` straight from these rows, so BVCLO2
-- read "22ml" when it is 22 Nos, and BB-Eveect 8 read "11ml" when it is 11 Ltr.
--
-- SOURCE OF TRUTH: Item Master. These medicines are kept as items, and
-- medicine_usage also drives stock_ledger. 604 measured the link:
--   105 medicines, 92 linked to an item, 13 NOT linked
--   of the 92 linked, only 3 disagree with medicines_master
-- So items.unit is used where it exists, with medicines_master.unit as the
-- fallback for the 13 unlinked (Fertimax among them). Not the other way round.
--
-- THE 3 CONFLICTS ARE DELIBERATELY NOT TOUCHED:
--   Biospark Gold          medicine=Ltr  item=kg
--   Dabur Gut Health Juice medicine=ML   item=Ltr
--   Formalin               medicine=Ltr  item=kg
-- Litres and kilos are not the same measurement. Picking one would silently
-- restate a real quantity, so these rows keep what they have until the two
-- masters are reconciled by hand. Statement 4 counts what was left behind.
--
-- Only the unit TEXT changes. No quantity is altered, and stock_ledger is not
-- touched — its 479 'ml' rows are a separate decision.

-- 1. What will change, measured before changing it.
SELECT COUNT(*) AS rows_to_fix
FROM public.medicine_usage u
JOIN public.medicines_master m ON m.id = u.medicine_id
LEFT JOIN public.items i ON i.id = m.item_id
WHERE COALESCE(i.unit, m.unit) IS NOT NULL
  AND u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)
  AND (i.unit IS NULL OR m.unit IS NULL OR LOWER(TRIM(i.unit)) = LOWER(TRIM(m.unit)));

-- 2. The repair. The last condition skips any medicine whose two masters
--    disagree, so a disputed unit is never written.
UPDATE public.medicine_usage u
SET unit = COALESCE(i.unit, m.unit)
FROM public.medicines_master m
LEFT JOIN public.items i ON i.id = m.item_id
WHERE m.id = u.medicine_id
  AND COALESCE(i.unit, m.unit) IS NOT NULL
  AND u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)
  AND (i.unit IS NULL OR m.unit IS NULL OR LOWER(TRIM(i.unit)) = LOWER(TRIM(m.unit)));

-- 3. Units actually stored now. 'ml=585' should be gone, replaced by a spread
--    matching the masters (Dose, Ltr, kg, Nos, ML, ...).
SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS usage_units_after
FROM (
  SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.medicine_usage GROUP BY 1
) y;

-- 4. What is knowingly left: rows on the 3 conflicting medicines, and rows
--    whose medicine has no unit anywhere. Named, so nothing is left silently.
SELECT COUNT(*) AS rows_left_unfixed,
       COALESCE(string_agg(DISTINCT m.name || ' (usage=' || COALESCE(u.unit,'null')
                || ' medicine=' || COALESCE(m.unit,'null')
                || ' item=' || COALESCE(i.unit,'no link') || ')', ' | '), 'NONE') AS left_unfixed
FROM public.medicine_usage u
JOIN public.medicines_master m ON m.id = u.medicine_id
LEFT JOIN public.items i ON i.id = m.item_id
WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit);

-- 5. Final agreement check against the source of truth.
SELECT COUNT(*) AS usage_rows_total,
       COUNT(*) FILTER (WHERE u.unit = COALESCE(i.unit, m.unit)) AS agree_with_master,
       COUNT(*) FILTER (WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS still_disagree
FROM public.medicine_usage u
LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
LEFT JOIN public.items i ON i.id = m.item_id;
