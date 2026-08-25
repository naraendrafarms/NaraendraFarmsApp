-- Migration 926 (READ ONLY): do the app's own pre-existing per-shed rows
-- (untagged, i.e. real user-entered data) already have he_eggs/je_eggs/etc
-- populated, or are they also blank/zero (meaning they'd need the same fix)?
SELECT 'existing_per_shed_he_sample' AS chk,
       string_agg((d.record_date::text || ' sh' || s.shed_no || ' he=' || d.he_eggs || ' je=' || d.je_eggs || ' te=' || d.te_eggs || ' be=' || d.be_eggs), ' | ' ORDER BY d.record_date) AS rows
  FROM (
    SELECT * FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no::text='20' AND d.shed_id IS NOT NULL
      AND d.remarks IS DISTINCT FROM 'F20_IMPORT_2026-08-24'
    ORDER BY d.record_date LIMIT 8
  ) d
  JOIN public.sheds s ON s.id = d.shed_id;

SELECT 'existing_per_shed_he_nonzero_count' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text='20' AND d.shed_id IS NOT NULL
   AND d.remarks IS DISTINCT FROM 'F20_IMPORT_2026-08-24'
   AND (COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)) > 0;
