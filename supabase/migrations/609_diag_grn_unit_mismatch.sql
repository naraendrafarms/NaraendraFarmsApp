-- Diagnostic only (no schema changes, no data changes).
--
-- The same unit problem may exist on the receiving side: a GRN can be recorded
-- in one unit while Item Master holds another — "Fertimax 4000 Nos in the item
-- master but received 4000ML". grn.unit even DEFAULTS to 'kg', the same shape
-- of bug as medicine_usage's hardcoded 'ml', so a GRN saved without an explicit
-- unit silently claims kg.
--
-- This matters more than the report wording did: GRN quantity feeds stock and
-- purchase value, so a unit mismatch means stock is being added in one measure
-- and consumed in another, and the balance is meaningless.
--
-- Measure it before proposing anything. Five statements, each returning a row.

-- 1. Scale: how many GRN lines carry a unit that differs from their item's.
SELECT COUNT(*) AS grn_rows,
       COUNT(g.item_id) AS with_item_link,
       COUNT(*) FILTER (WHERE g.item_id IS NOT NULL
                          AND LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS unit_differs,
       COUNT(*) FILTER (WHERE g.unit IS NULL) AS no_unit_on_grn
FROM public.grn g
LEFT JOIN public.items i ON i.id = g.item_id;

-- 2. Which units GRN actually uses, so a default-'kg' pattern is visible.
SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS grn_units
FROM (
  SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.grn GROUP BY 1
) x;

-- 3. The mismatches themselves, worst first — item name, what the GRN said,
--    what Item Master says, and how many lines. Capped so the log stays legible.
SELECT COALESCE(string_agg(line, ' | '), 'NONE') AS mismatches
FROM (
  SELECT COALESCE(i.name, g.item_name, '?') || ': grn=' || COALESCE(g.unit,'null')
         || ' item=' || COALESCE(i.unit,'null') || ' x' || COUNT(*) AS line
  FROM public.grn g
  JOIN public.items i ON i.id = g.item_id
  WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))
  GROUP BY 1, g.unit, i.unit, i.name, g.item_name
  ORDER BY COUNT(*) DESC
  LIMIT 25
) y;

-- 4. Restricted to MEDICINE items specifically — these are the ones whose
--    consumption units were just corrected, so a mismatch here means receipts
--    and issues are now in different measures for the same thing.
SELECT COALESCE(string_agg(line, ' | '), 'NONE') AS medicine_item_mismatches
FROM (
  SELECT i.name || ': grn=' || COALESCE(g.unit,'null') || ' item=' || COALESCE(i.unit,'null')
         || ' x' || COUNT(*) AS line
  FROM public.grn g
  JOIN public.items i ON i.id = g.item_id
  JOIN public.medicines_master m ON m.item_id = i.id
  WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))
  GROUP BY i.name, g.unit, i.unit
  ORDER BY COUNT(*) DESC
  LIMIT 25
) z;

-- 5. Fertimax by name — it has no item link at all, so it is worth seeing what
--    its GRN lines say on their own.
SELECT COALESCE(string_agg('grn ' || COALESCE(g.grn_no,'?') || ' ' || g.grn_date::text
         || ': ' || COALESCE(g.qty::text,'?') || ' ' || COALESCE(g.unit,'null')
         || ' item_link=' || COALESCE(i.name || '/' || COALESCE(i.unit,'null'), 'none'),
         ' | ' ORDER BY g.grn_date), 'NO GRN ROWS') AS fertimax_grn
FROM public.grn g
LEFT JOIN public.items i ON i.id = g.item_id
WHERE g.item_name ILIKE '%fertimax%' OR i.name ILIKE '%fertimax%';
