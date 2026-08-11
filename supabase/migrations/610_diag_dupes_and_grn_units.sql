-- Diagnostic only (no schema changes, no data changes).
--
-- Two unfinished things:
--
-- (1) 607 merged 11 duplicate name-groups, then its closing check reported FOUR
--     groups that were NOT in its opening list (cevac ibird, ilt vaccine tissue
--     culture, inactivated pullet nd hpai vaccine (w), volvac ac plus emul
--     bacterin). 608 confirmed they are 2 rows each, not 3, and that the
--     original 11 are ALL GONE. Merging deletes rows; it cannot create new
--     duplicate groups. The suspicion is the trigger from 453
--     (trg_medicines_master_set_item_id), which fires BEFORE UPDATE and
--     re-resolves item_id and registers name aliases — 607's spelling UPDATE
--     touched every row, and Fertimax has since gained an item link it did not
--     have when 604 ran. Look at the rows by id before merging anything else.
--
-- (2) 609's statement 3 failed (bad GROUP BY over an expression containing
--     COUNT) and returned Errors: 1, so the whole-inventory GRN unit mismatch
--     was never counted. Only the medicine subset is known. Redone here.
--
-- Five statements, each returning exactly one row.

-- 1. The duplicate rows themselves, by id, with everything that could explain
--    why they now collide: exact name in brackets, its length (a trailing
--    space or non-breaking character shows up as a length that does not match
--    the visible text), type, item link, and usage count.
SELECT COALESCE(string_agg(
         m.id::text || ' [' || m.name || '] len=' || LENGTH(m.name)
         || ' type=' || COALESCE(m.type,'?')
         || ' unit=' || COALESCE(m.unit,'null')
         || ' item_id=' || COALESCE(m.item_id::text,'NULL')
         || ' usage=' || (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id)
         || ' created=' || COALESCE(m.created_at::text,'?'),
         ' || ' ORDER BY LOWER(TRIM(m.name)), m.created_at), 'NONE') AS duplicate_rows_by_id
FROM public.medicines_master m
WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) IN (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'))
  FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1);

-- 2. Are the two rows in each pair byte-identical in name, or do they only look
--    identical? If every pair reports same_exact_name, they were always true
--    duplicates and 607's opening list simply did not see them; if any pair
--    differs, something rewrote a name.
SELECT COUNT(*) AS duplicate_groups,
       COUNT(*) FILTER (WHERE distinct_exact_names = 1) AS groups_byte_identical,
       COUNT(*) FILTER (WHERE distinct_exact_names > 1) AS groups_only_look_alike,
       COALESCE(string_agg(nm || ' items=' || distinct_items, ' | ' ORDER BY nm), 'NONE') AS item_links_per_group
FROM (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm,
         COUNT(DISTINCT name) AS distinct_exact_names,
         COUNT(DISTINCT COALESCE(item_id::text,'NULL')) AS distinct_items
  FROM public.medicines_master
  GROUP BY 1 HAVING COUNT(*) > 1
) g;

-- 3. Whole-inventory GRN unit picture — the count 609 never produced.
SELECT COUNT(*) AS grn_rows,
       COUNT(g.item_id) AS with_item_link,
       COUNT(*) FILTER (WHERE g.item_id IS NOT NULL
                          AND LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS unit_differs,
       COUNT(*) FILTER (WHERE g.item_id IS NOT NULL
                          AND LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))
                          AND REPLACE(LOWER(TRIM(g.unit)),'s','') = REPLACE(LOWER(TRIM(i.unit)),'s','')) AS differs_only_by_spelling,
       COUNT(*) FILTER (WHERE g.unit IS NULL) AS no_unit_on_grn
FROM public.grn g
LEFT JOIN public.items i ON i.id = g.item_id;

-- 4. The real mismatches across ALL items, spelling-only differences excluded,
--    so what is left is a genuine change of measure. GROUP BY written properly
--    this time: aggregate first, compose the label after.
SELECT COALESCE(string_agg(nm || ': grn=' || gu || ' item=' || iu || ' x' || c, ' | ' ORDER BY c DESC), 'NONE') AS real_mismatches
FROM (
  SELECT COALESCE(i.name, g.item_name, '?') AS nm,
         COALESCE(g.unit,'null') AS gu, COALESCE(i.unit,'null') AS iu, COUNT(*) AS c
  FROM public.grn g
  JOIN public.items i ON i.id = g.item_id
  WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))
    AND REPLACE(LOWER(TRIM(g.unit)),'s','') IS DISTINCT FROM REPLACE(LOWER(TRIM(i.unit)),'s','')
  GROUP BY 1, 2, 3
  ORDER BY COUNT(*) DESC
  LIMIT 30
) y;

-- 5. Fertimax is ML (your ruling), so GRN 2828's "4000 Nos" is the wrong side.
--    Show every Fertimax GRN row and what Item Master says, plus how many GRN
--    rows in total would change if receipts were aligned to Item Master. NOT
--    changed here — GRN quantity drives stock and purchase value.
SELECT (SELECT COALESCE(string_agg('grn ' || COALESCE(g.grn_no,'?') || ' ' || g.grn_date::text
          || ': ' || COALESCE(g.qty::text,'?') || ' ' || COALESCE(g.unit,'null')
          || ' item=' || COALESCE(i.name || '/' || COALESCE(i.unit,'null'),'no link'), ' | ' ORDER BY g.grn_date), 'NONE')
        FROM public.grn g LEFT JOIN public.items i ON i.id = g.item_id
        WHERE g.item_name ILIKE '%fertimax%' OR i.name ILIKE '%fertimax%') AS fertimax_grn,
       (SELECT COALESCE(string_agg(name || '=' || COALESCE(unit,'null'), ', '), 'NONE')
        FROM public.items WHERE name ILIKE '%fertimax%') AS fertimax_item_master,
       (SELECT COUNT(*) FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS grn_rows_that_would_change;
