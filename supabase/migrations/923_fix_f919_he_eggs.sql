-- Migration 923: fix the 200 egg-grade-import rows -- he_eggs was never set
-- (the app's own DailyEntry form computes he_eggs = grade_a+b+c client-side
-- at save time; my direct SQL insert skipped that derived field).
UPDATE public.daily_records
   SET he_eggs = COALESCE(he_grade_a,0) + COALESCE(he_grade_b,0) + COALESCE(he_grade_c,0)
 WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25';

SELECT 'f923_fix_check' AS chk,
       string_agg((d.record_date::text || ' he_eggs=' || d.he_eggs), ' | ' ORDER BY d.record_date) AS rows
  FROM (
    SELECT * FROM public.daily_records d
     WHERE d.remarks = 'F20_EGGGRADE_IMPORT_2026-08-25'
     ORDER BY d.record_date LIMIT 5
  ) d;
