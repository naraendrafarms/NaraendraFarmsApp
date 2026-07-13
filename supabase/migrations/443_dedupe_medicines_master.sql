-- medicines_master.name has no unique constraint, and the client-side
-- dup-check previously only trimmed leading/trailing whitespace — so
-- "Vitalosin 62.5 %" and "Vitalosin 62.5%" (differ by one internal space)
-- both got through as "different" and created a real duplicate row, which
-- then showed up twice in every medicine dropdown across the app (Daily
-- Entry, Bulk Daily Entry, Medicine Purchases, etc.) even though the
-- generic Items Master correctly showed only one. The app-side check is
-- fixed separately to normalize internal whitespace too; this migration
-- cleans up whatever duplicates already exist, using the same
-- remap-then-delete pattern as the Merge Duplicates tool on the Medicines
-- master page (medicine_usage / medicine_purchases repointed to the kept
-- row before the duplicate row is deleted).

-- Diagnostic first (per project convention — later statements' output can
-- get truncated in the migration runner's log): show what will be merged.
SELECT lower(regexp_replace(trim(name), '\s+', ' ', 'g')) AS norm_name, count(*) AS dup_count,
  array_agg(name ORDER BY created_at NULLS LAST, id) AS names
FROM public.medicines_master
GROUP BY norm_name
HAVING count(*) > 1;

DO $$
DECLARE
  grp RECORD;
  keep_id UUID;
  drop_id UUID;
BEGIN
  FOR grp IN
    SELECT lower(regexp_replace(trim(name), '\s+', ' ', 'g')) AS norm_name
    FROM public.medicines_master
    GROUP BY norm_name
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keep_id FROM public.medicines_master
      WHERE lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = grp.norm_name
      ORDER BY created_at NULLS LAST, id LIMIT 1;

    FOR drop_id IN
      SELECT id FROM public.medicines_master
      WHERE lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = grp.norm_name AND id <> keep_id
    LOOP
      UPDATE public.medicine_usage SET medicine_id = keep_id WHERE medicine_id = drop_id;
      BEGIN
        UPDATE public.medicine_purchases SET medicine_id = keep_id WHERE medicine_id = drop_id;
      EXCEPTION WHEN undefined_table THEN NULL;
      END;
      DELETE FROM public.medicines_master WHERE id = drop_id;
    END LOOP;
  END LOOP;
END $$;

SELECT 'sentinel' AS marker, 1 AS n;
