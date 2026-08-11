-- Diagnostic only (no schema changes, no data changes).
--
-- 607 merged the 11 duplicate pairs it listed and reported Errors: 0, but its
-- closing check found FOUR pairs that were not in its opening list:
--   cevac ibird, volvac ac plus emul bacterin,
--   inactivated pullet nd hpai vaccine (w), ilt vaccine tissue culture
-- Merging deletes rows; it cannot create new duplicate groups. So either those
-- groups held MORE than two rows (the loop collapsed 3 to 2, not to 1), or the
-- DELETEs inside the loop changed what the outer cursor saw part-way through.
--
-- Do not guess which. Look at the actual rows — ids, exact names with their
-- whitespace made visible, created_at, usage counts and item links — and the
-- group sizes, before running any further merge.

-- 1. Group sizes now. If any of these reads x3 or more, the loop simply did not
--    finish the group and a second pass fixes it. If they all read x2, the
--    cursor explanation stands and the merge needs rewriting to snapshot first.
SELECT COALESCE(string_agg(nm || ' x' || c, ' | ' ORDER BY c DESC, nm), 'NONE') AS duplicate_groups
FROM (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
  FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1
) d;

-- 2. The rows themselves. Name wrapped in [] so leading/trailing space shows.
SELECT COALESCE(string_agg(
         '[' || m.name || '] type=' || COALESCE(m.type,'?')
         || ' unit=' || COALESCE(m.unit,'null')
         || ' item=' || COALESCE(i.unit,'no link')
         || ' usage=' || (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id)
         || ' created=' || COALESCE(m.created_at::date::text,'?'),
         ' || ' ORDER BY LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')), m.created_at), 'NONE') AS duplicate_rows
FROM public.medicines_master m
LEFT JOIN public.items i ON i.id = m.item_id
WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) IN (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'))
  FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1
);

-- 3. Did the 11 from 607 actually merge, or did some survive under a name that
--    normalises differently? Count what is left of each.
SELECT COALESCE(string_agg(nm || '=' || c, ', ' ORDER BY nm), 'ALL GONE') AS previously_merged_names_still_multiple
FROM (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
  FROM public.medicines_master
  WHERE LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) IN (
    'aqua secure 888','dabur gut health juice','enrocine (5 ltrs)','hivit inj (100ml)',
    'k-oxishield 888 (500gm)','kohrsolin th ltr','nd killed (1000 dose)',
    'tamik vet inj (100 ml)','tilmovet (240 ml)','ventriplex-m (5 ltr)',
    'vh encepox (ae+fp) live vaccine')
  GROUP BY 1 HAVING COUNT(*) > 1
) x;

-- 4. Nothing was orphaned by the merge: every usage row must still point at a
--    medicine that exists.
SELECT COUNT(*) AS usage_rows,
       COUNT(*) FILTER (WHERE m.id IS NULL) AS orphaned_usage_rows,
       COUNT(*) FILTER (WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS unit_disagreements
FROM public.medicine_usage u
LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
LEFT JOIN public.items i ON i.id = m.item_id;

-- 5. Master totals, so the merge's effect on the count is visible.
SELECT COUNT(*) AS medicines_total,
       COUNT(item_id) AS linked_to_item,
       COUNT(*) FILTER (WHERE item_id IS NULL) AS not_linked_to_item,
       COALESCE(string_agg(DISTINCT COALESCE(unit,'(null)'), ', '), 'NONE') AS distinct_units
FROM public.medicines_master;
