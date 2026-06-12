-- Migration 045: Add HE grade breakdown to daily_records
-- he_eggs remains for legacy/import; he_grade_a/b/c are the grade split
-- wastage_eggs added (other losses beyond broken/leached)
ALTER TABLE public.daily_records
  ADD COLUMN IF NOT EXISTS he_grade_a  INTEGER,
  ADD COLUMN IF NOT EXISTS he_grade_b  INTEGER,
  ADD COLUMN IF NOT EXISTS he_grade_c  INTEGER,
  ADD COLUMN IF NOT EXISTS wastage_eggs INTEGER;

NOTIFY pgrst, 'reload schema';
