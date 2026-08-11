-- Three leftovers in Medicine Master, on your ruling. 614 measured all three at
-- usage=0, so no consumption history is at stake in any of them.
--
--   a) "Flyvin 1 Kg" merged into "Flyvin" — same product under two names.
--      "Flyvin" is the survivor because it is the one linked to an item.
--      Usage and purchases are remapped before the delete anyway, so the merge
--      is safe even if a row appears between 614 and now.
--   b) "Anichol 60" is Anichol-60 (Jubilant), a brand of Choline Chloride 60% —
--      so it is LINKED to that item, not deleted. It stays as its own medicine
--      entry with its own name; only the item link is added, which puts its
--      unit under Item Master like everything else.
--   c) "VH VVND(VENGEM-9) Killed vaccine" is deleted ONLY IF it has no usage.
--      The NOT EXISTS guard is the point: if a row was recorded against it in
--      the last few minutes, the delete silently does nothing rather than
--      destroying history, and statement 4 will still show the medicine.

-- 1. Merge Flyvin 1 Kg into Flyvin.
DO
$$
DECLARE
  keep_id UUID;
  drop_id UUID;
BEGIN
  SELECT id INTO keep_id FROM public.medicines_master
   WHERE name ILIKE 'flyvin' AND item_id IS NOT NULL
   ORDER BY created_at LIMIT 1;
  IF keep_id IS NULL THEN
    SELECT id INTO keep_id FROM public.medicines_master
     WHERE name ILIKE '%flyvin%' ORDER BY (item_id IS NOT NULL) DESC, created_at LIMIT 1;
  END IF;

  IF keep_id IS NOT NULL THEN
    FOR drop_id IN
      SELECT id FROM public.medicines_master WHERE name ILIKE '%flyvin%' AND id <> keep_id
    LOOP
      UPDATE public.medicine_usage SET medicine_id = keep_id WHERE medicine_id = drop_id;
      BEGIN
        UPDATE public.medicine_purchases SET medicine_id = keep_id WHERE medicine_id = drop_id;
      EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
      END;
      DELETE FROM public.medicines_master WHERE id = drop_id;
    END LOOP;
  END IF;
END
$$;

-- 2. Anichol 60 → linked to the Choline Chloride 60% item. If no such item
--    exists the UPDATE simply matches nothing and statement 4 will still show
--    "NO LINK" — no silent half-fix.
UPDATE public.medicines_master m
SET item_id = i.id,
    unit = COALESCE(i.unit, m.unit)
FROM public.items i
WHERE m.name ILIKE '%anichol%'
  AND i.name ILIKE '%choline%chloride%'
  AND i.id = (SELECT id FROM public.items WHERE name ILIKE '%choline%chloride%' ORDER BY name LIMIT 1);

-- 3. Delete VH VVND(VENGEM-9) only if genuinely unused.
DELETE FROM public.medicines_master m
WHERE (m.name ILIKE '%vengem%' OR m.name ILIKE '%vvnd%')
  AND NOT EXISTS (SELECT 1 FROM public.medicine_usage u WHERE u.medicine_id = m.id);

-- 4. All three, checked individually rather than assumed.
SELECT (SELECT COALESCE(string_agg(m.name || '=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.name || '/' || COALESCE(i.unit,'null'), 'NO LINK')
          || ' usage=' || (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id),
          ' | ' ORDER BY m.name), 'NONE LEFT')
        FROM public.medicines_master m LEFT JOIN public.items i ON i.id = m.item_id
        WHERE m.name ILIKE '%flyvin%' OR m.name ILIKE '%anichol%'
           OR m.name ILIKE '%vengem%' OR m.name ILIKE '%vvnd%') AS the_three_now,
       (SELECT COALESCE(string_agg(name || '=' || COALESCE(unit,'null'), ', ' ORDER BY name), 'NONE')
        FROM public.items WHERE name ILIKE '%choline%chloride%') AS choline_items,
       (SELECT COUNT(*) FROM public.medicines_master) AS medicines_total;

-- 5. Nothing broken by the merge or the delete, and nothing left unlinked.
SELECT (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        WHERE m.id IS NULL) AS orphaned_usage_rows,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS usage_rows_not_matching,
       (SELECT COALESCE(string_agg(name, ', ' ORDER BY name), 'NONE')
        FROM public.medicines_master WHERE item_id IS NULL) AS still_no_item_link,
       (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1) d) AS duplicates_left;
