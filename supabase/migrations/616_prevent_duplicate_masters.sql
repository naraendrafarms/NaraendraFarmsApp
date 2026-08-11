-- Permanent fix for duplicates, rather than merging them again each time.
--
-- Duplicates keep coming back because NOTHING stops them being created. The
-- only guard is a client-side check in the Add Medicine form (MastersPages),
-- which compares normalised names against the rows already loaded in the page.
-- Anything not going through that form bypasses it entirely: the CSV import,
-- the QuickAddMedicine widget on the entry screens, and two people adding the
-- same medicine at once. That is why "Sterile Diluent 30 ML" reappeared after
-- being merged.
--
-- A UNIQUE INDEX on the normalised name makes it impossible at the database
-- level, for every route in and out of the app. Same for Items Master, which
-- has the same exposure and currently happens to be clean.
--
-- Duplicates must be merged BEFORE the index can be created, so statement 1
-- does that first — history remapped, then delete, as with every merge here.

-- 1. Merge whatever duplicates exist right now, snapshot-first.
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

-- 2. The guard itself. Normalised the same way the app's own check normalises,
--    so "Vitalosin 62.5 %" and "Vitalosin 62.5%" collide as they should.
CREATE UNIQUE INDEX IF NOT EXISTS ux_medicines_master_name_norm
  ON public.medicines_master (LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')));

-- 3. Item Master has the same exposure and is currently clean — guard it now,
--    while it is clean, rather than after the next duplicate appears.
CREATE UNIQUE INDEX IF NOT EXISTS ux_items_name_norm
  ON public.items (LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')));

-- 4. Both indexes must actually exist. run_sql.py treats "already exists" as
--    success, so their presence is checked directly rather than trusted.
SELECT COALESCE(string_agg(indexname, ', ' ORDER BY indexname), 'MISSING — NOT CREATED') AS guards_created
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('ux_medicines_master_name_norm', 'ux_items_name_norm');

-- 5. Nothing left duplicated, nothing orphaned by the merge.
SELECT (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.medicines_master GROUP BY 1 HAVING COUNT(*) > 1) d) AS medicine_duplicates_left,
       (SELECT COALESCE(string_agg(nm || ' x' || c, ' | '), 'NONE') FROM (
          SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')) AS nm, COUNT(*) AS c
          FROM public.items GROUP BY 1 HAVING COUNT(*) > 1) e) AS item_duplicates_left,
       (SELECT COUNT(*) FROM public.medicine_usage u
        LEFT JOIN public.medicines_master m ON m.id = u.medicine_id
        WHERE m.id IS NULL) AS orphaned_usage_rows,
       (SELECT COUNT(*) FROM public.medicines_master) AS medicines_total,
       (SELECT COUNT(*) FROM public.medicines_master m
        LEFT JOIN public.items i ON i.id = m.item_id
        WHERE m.item_id IS NOT NULL AND (i.id IS NULL OR i.is_active IS FALSE)) AS medicines_pointing_at_dead_items;
