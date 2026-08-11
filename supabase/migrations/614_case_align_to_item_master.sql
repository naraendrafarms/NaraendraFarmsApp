-- "Kg or kg are both the same — keep as per master."
--
-- Taken literally: where a stored unit already means the same thing as Item
-- Master and differs only in case, the stored value is rewritten to Item
-- Master's exact spelling. Nothing changes meaning; only the text matches its
-- master. Units that differ in substance are NOT touched by this (there are
-- none left — 613 reported grn_rows_differing = 0).
--
-- Applied to GRN and to the stock ledger. medicine_usage already takes its unit
-- from the master on save, so it is aligned by construction.
--
-- Also checks the three medicines that had no item link, which you have since
-- worked on: Anichol 60 (renamed to Choline Chloride and merged), Flyvin (kg),
-- and VH VVND(VENGEM-9) Killed vaccine (believed merged). Statement 3 looks for
-- them by their old AND new names rather than assuming the edits landed.

-- 1. GRN: match Item Master's exact spelling.
UPDATE public.grn g
SET unit = i.unit
FROM public.items i
WHERE i.id = g.item_id
  AND g.unit IS DISTINCT FROM i.unit
  AND LOWER(TRIM(g.unit)) = LOWER(TRIM(i.unit));

-- 2. Stock ledger: same rule.
UPDATE public.stock_ledger sl
SET unit = i.unit
FROM public.items i
WHERE i.id = sl.item_id
  AND sl.unit IS DISTINCT FROM i.unit
  AND LOWER(TRIM(sl.unit)) = LOWER(TRIM(i.unit));

-- 3. The three medicines, by old and new name, plus whether anything still
--    lacks an item link.
SELECT (SELECT COALESCE(string_agg(m.name || '=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.name || '/' || COALESCE(i.unit,'null'), 'NO LINK')
          || ' usage=' || (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id),
          ' | ' ORDER BY m.name), 'NONE FOUND')
        FROM public.medicines_master m LEFT JOIN public.items i ON i.id = m.item_id
        WHERE m.name ILIKE '%anichol%' OR m.name ILIKE '%choline%'
           OR m.name ILIKE '%flyvin%' OR m.name ILIKE '%vengem%' OR m.name ILIKE '%vvnd%') AS the_three,
       (SELECT COALESCE(string_agg(name || '=' || COALESCE(unit,'null'), ', ' ORDER BY name), 'NONE')
        FROM public.medicines_master WHERE item_id IS NULL) AS still_no_item_link,
       (SELECT COUNT(*) FROM public.medicines_master) AS medicines_total;

-- 4. Nothing should differ from Item Master now, in substance OR in case.
SELECT (SELECT COUNT(*) FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE g.unit IS DISTINCT FROM i.unit) AS grn_rows_not_exactly_matching,
       (SELECT COUNT(*) FROM public.stock_ledger sl JOIN public.items i ON i.id = sl.item_id
        WHERE sl.unit IS DISTINCT FROM i.unit) AS ledger_rows_not_exactly_matching,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS usage_rows_not_matching;

-- 5. Final spellings in use on every surface.
SELECT (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.items GROUP BY 1) a) AS item_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.grn GROUP BY 1) b) AS grn_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.medicine_usage GROUP BY 1) c) AS usage_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.stock_ledger GROUP BY 1) d) AS ledger_units;
