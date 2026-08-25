-- Migration 922 (READ ONLY): for the app's own existing flock-level rows,
-- does he_eggs = he_grade_a + he_grade_b + he_grade_c? Confirms the right fix.
SELECT 'he_eggs_vs_grades' AS chk,
       string_agg((d.record_date::text || ' he_eggs=' || d.he_eggs || ' sum_grades=' || (COALESCE(he_grade_a,0)+COALESCE(he_grade_b,0)+COALESCE(he_grade_c,0))), ' | ' ORDER BY d.record_date) AS rows
  FROM (
    SELECT * FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no::text='20' AND d.shed_id IS NULL
      AND d.remarks IS DISTINCT FROM 'F20_EGGGRADE_IMPORT_2026-08-25'
    ORDER BY d.record_date LIMIT 8
  ) d;
