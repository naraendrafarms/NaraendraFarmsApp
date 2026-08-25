-- Migration 924 (READ ONLY): confirm he_eggs is now correctly nonzero for a
-- date with real grade data (2025-12-01, where GR A alone was 10,150 per the user's screenshot).
SELECT 'dec1_check' AS chk, he_eggs, he_grade_a, he_grade_b, he_grade_c
  FROM public.daily_records
 WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25' AND record_date = '2025-12-01';
