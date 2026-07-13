-- Migration 443's normalization (collapse repeated whitespace) didn't
-- actually catch "Vitalosin 62.5 %" vs "Vitalosin 62.5%" — the difference
-- there is the PRESENCE of a single space, not repeated whitespace, so
-- collapsing runs of spaces to one changes neither string and they still
-- don't match. Confirmed via migration 444: remaining_dup_groups was 0
-- under that normalization, yet both rows were still present. This
-- version strips ALL whitespace before comparing, matching the app-side
-- normalizeName fix.

SELECT lower(regexp_replace(name, '\s+', '', 'g')) AS norm_name, count(*) AS dup_count,
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
    SELECT lower(regexp_replace(name, '\s+', '', 'g')) AS norm_name
    FROM public.medicines_master
    GROUP BY norm_name
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keep_id FROM public.medicines_master
      WHERE lower(regexp_replace(name, '\s+', '', 'g')) = grp.norm_name
      ORDER BY created_at NULLS LAST, id LIMIT 1;

    FOR drop_id IN
      SELECT id FROM public.medicines_master
      WHERE lower(regexp_replace(name, '\s+', '', 'g')) = grp.norm_name AND id <> keep_id
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
