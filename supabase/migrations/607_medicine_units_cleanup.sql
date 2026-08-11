-- Three things, on your ruling:
--   a) Formalin is kg (Medicine Master said Ltr, Item Master already said kg)
--   b) merge duplicate medicines_master rows (two "Dabur Gut Health Juice")
--   c) normalise the unit spellings
--
-- (b) DUPLICATE RULE: rows whose names match once case and internal whitespace
-- are collapsed — the same normalisation the Add Medicine form already uses to
-- block duplicates. The survivor is the row with the MOST usage rows, ties
-- broken by the oldest created_at, so history stays with the entry that has
-- the most of it. Usage and purchases are remapped BEFORE deleting, mirroring
-- the app's own Merge action; deleting first would detach the history.
--
-- (c) SPELLING RULE: the majority spelling already in use wins, so the fewest
-- rows change and nothing new is invented:
--   LTR/ltr → Ltr (215 rows already Ltr)      Kg/KG → kg (162 already kg)
--   Gm → Gms (67 already Gms)                 Doses → Dose (90 already Dose)
--   ml → ML  (34 already ML)
-- Applied to medicines_master, medicine_usage, and ONLY those items rows a
-- medicine points at — feed and other inventory items are left untouched,
-- since their casing is not this fix's business.
--
-- Exactly 5 statements: run_sql.py prints only the first 5, and the DO blocks
-- and UPDATEs return no rows, so the two reports must sit at 1 and 5.

-- 1. The duplicates, named before anything is merged.
SELECT COALESCE(string_agg(nm || ' x' || c, ' | ' ORDER BY nm), 'NONE') AS duplicates_before
FROM (
  SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
  FROM public.medicines_master
  GROUP BY 1 HAVING COUNT(*) > 1
) d;

-- 2. Merge them.
DO
$$
DECLARE
  keep_id UUID;
  drop_id UUID;
  nm TEXT;
BEGIN
  FOR nm IN
    SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'))
    FROM public.medicines_master
    GROUP BY 1 HAVING COUNT(*) > 1
  LOOP
    SELECT m.id INTO keep_id
    FROM public.medicines_master m
    WHERE LOWER(REGEXP_REPLACE(TRIM(m.name), '\s+', ' ', 'g')) = nm
    ORDER BY (SELECT COUNT(*) FROM public.medicine_usage u WHERE u.medicine_id = m.id) DESC,
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

-- 3. Formalin is kg. Item Master already says kg, so only the medicine master
--    moves and the two then agree.
UPDATE public.medicines_master SET unit = 'kg' WHERE name ILIKE '%formalin%';

-- 4. Normalise spellings in all three places.
DO
$$
BEGIN
  UPDATE public.medicines_master SET unit = CASE LOWER(TRIM(unit))
    WHEN 'ltr' THEN 'Ltr' WHEN 'l' THEN 'Ltr' WHEN 'litre' THEN 'Ltr' WHEN 'liter' THEN 'Ltr'
    WHEN 'kg' THEN 'kg' WHEN 'kgs' THEN 'kg'
    WHEN 'gm' THEN 'Gms' WHEN 'gms' THEN 'Gms' WHEN 'g' THEN 'Gms'
    WHEN 'dose' THEN 'Dose' WHEN 'doses' THEN 'Dose'
    WHEN 'ml' THEN 'ML'
    WHEN 'nos' THEN 'Nos' WHEN 'no' THEN 'Nos'
    ELSE unit END
    WHERE unit IS NOT NULL;

  UPDATE public.medicine_usage SET unit = CASE LOWER(TRIM(unit))
    WHEN 'ltr' THEN 'Ltr' WHEN 'l' THEN 'Ltr' WHEN 'litre' THEN 'Ltr' WHEN 'liter' THEN 'Ltr'
    WHEN 'kg' THEN 'kg' WHEN 'kgs' THEN 'kg'
    WHEN 'gm' THEN 'Gms' WHEN 'gms' THEN 'Gms' WHEN 'g' THEN 'Gms'
    WHEN 'dose' THEN 'Dose' WHEN 'doses' THEN 'Dose'
    WHEN 'ml' THEN 'ML'
    WHEN 'nos' THEN 'Nos' WHEN 'no' THEN 'Nos'
    ELSE unit END
    WHERE unit IS NOT NULL;

  -- Only items a medicine actually points at. Feed and other inventory items
  -- keep whatever casing they have — not this fix's business.
  UPDATE public.items i SET unit = CASE LOWER(TRIM(i.unit))
    WHEN 'ltr' THEN 'Ltr' WHEN 'l' THEN 'Ltr' WHEN 'litre' THEN 'Ltr' WHEN 'liter' THEN 'Ltr'
    WHEN 'kg' THEN 'kg' WHEN 'kgs' THEN 'kg'
    WHEN 'gm' THEN 'Gms' WHEN 'gms' THEN 'Gms' WHEN 'g' THEN 'Gms'
    WHEN 'dose' THEN 'Dose' WHEN 'doses' THEN 'Dose'
    WHEN 'ml' THEN 'ML'
    WHEN 'nos' THEN 'Nos' WHEN 'no' THEN 'Nos'
    ELSE i.unit END
    WHERE i.unit IS NOT NULL
      AND i.id IN (SELECT item_id FROM public.medicines_master WHERE item_id IS NOT NULL);
END
$$;

-- 5. Verify all three: no duplicates left, no master conflicts left, one
--    spelling per unit, and every usage row still agreeing with its master.
SELECT (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1) d) AS duplicates_left,
       (SELECT COALESCE(string_agg(m.name || ' (medicine=' || COALESCE(m.unit,'null')
          || ' item=' || COALESCE(i.unit,'null') || ')', ' | '), 'NONE')
        FROM public.medicines_master m JOIN public.items i ON i.id = m.item_id
        WHERE LOWER(TRIM(m.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS master_conflicts_left,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c
          FROM public.medicine_usage GROUP BY 1) z) AS usage_units_now,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE u.unit IS DISTINCT FROM COALESCE(i.unit, m.unit)) AS usage_rows_disagreeing;
