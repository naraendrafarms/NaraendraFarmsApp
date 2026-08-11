-- 610 settled what 607 left open:
--   duplicate_groups=4, groups_byte_identical=4, groups_only_look_alike=0
-- The four remaining pairs are byte-for-byte identical names — nothing renamed
-- them, so they are genuine duplicates and safe to merge. (Why 607's opening
-- list did not show them is still unexplained; what matters is that the rows
-- are real duplicates, nothing was orphaned, and no name was rewritten.)
-- This merge snapshots the groups into a temp table FIRST and iterates that,
-- so DELETEs during the loop cannot affect what is still to be processed —
-- the one difference from 607.
--
-- 610 also produced the GRN count 609 failed to:
--   grn_rows=288, with_item_link=287, unit_differs=13, differs_only_by_spelling=9
--   real_mismatches: Diluents CDHB grn=ML item=Nos | Soya Transport Charges
--                    grn=Kg item=Nos x2 | Fertimax grn=Nos item=ML
-- The 9 spelling-only differences (Doses vs Dose and similar) are aligned here.
-- Fertimax is ML on your ruling, so GRN 2828's "4000 Nos" becomes 4000 ML —
-- the QUANTITY is untouched, only the unit label, so stock is added and issued
-- in the same measure.
--
-- Diluents CDHB (ML vs Nos) and Soya Transport Charges (Kg vs Nos) are NOT
-- touched — no ruling given, and these are genuine changes of measure.
-- Statement 5 keeps reporting them.

-- 1. Merge the four duplicate pairs, snapshot-first.
DO
$$
DECLARE
  keep_id UUID;
  drop_id UUID;
  nm TEXT;
BEGIN
  CREATE TEMP TABLE dupe_names ON COMMIT DROP AS
    SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm
    FROM public.medicines_master
    GROUP BY 1 HAVING COUNT(*) > 1;

  FOR nm IN SELECT d.nm FROM dupe_names d LOOP
    SELECT m.id INTO keep_id
    FROM public.medicines_master m
    WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = nm
    ORDER BY (m.item_id IS NOT NULL) DESC,
             (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id) DESC,
             m.created_at ASC NULLS LAST
    LIMIT 1;

    FOR drop_id IN
      SELECT m.id FROM public.medicines_master m
      WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = nm AND m.id <> keep_id
    LOOP
      UPDATE public.medicine_usage SET medicine_id = keep_id WHERE medicine_id = drop_id;
      BEGIN
        UPDATE public.medicine_purchases SET medicine_id = keep_id WHERE medicine_id = drop_id;
      EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
      END;
      DELETE FROM public.medicines_master WHERE id = drop_id;
    END LOOP;
  END LOOP;
END
$$;

-- 2. GRN spelling-only differences aligned to Item Master. The measure is the
--    same in every one of these; only the spelling moves.
UPDATE public.grn g
SET unit = i.unit
FROM public.items i
WHERE i.id = g.item_id
  AND LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))
  AND REPLACE(LOWER(TRIM(g.unit)),'s','') = REPLACE(LOWER(TRIM(i.unit)),'s','');

-- 3. Fertimax is ML. Quantity untouched — 4000 stays 4000.
UPDATE public.grn g
SET unit = 'ML'
FROM public.items i
WHERE i.id = g.item_id AND i.name ILIKE '%fertimax%';

-- 4. Verify both halves.
SELECT (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1) d) AS duplicates_left,
       (SELECT COUNT(*) FROM public.medicines_master) AS medicines_total,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        WHERE m.id IS NULL) AS orphaned_usage_rows,
       (SELECT COALESCE(string_agg('grn ' || COALESCE(g.grn_no,'?') || ': ' || g.qty::text
          || ' ' || COALESCE(g.unit,'null'), ' | '), 'NONE')
        FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE i.name ILIKE '%fertimax%') AS fertimax_grn_now;

-- 5. What is knowingly left on the GRN side, for your ruling.
SELECT COUNT(*) AS grn_rows_still_differing,
       COALESCE(string_agg(DISTINCT COALESCE(i.name, g.item_name,'?') || ': grn='
                || COALESCE(g.unit,'null') || ' item=' || COALESCE(i.unit,'null'), ' | '), 'NONE') AS still_differing
FROM public.grn g
JOIN public.items i ON i.id = g.item_id
WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit));
