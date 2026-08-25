-- Migration 928: fix the HE% double-counting the user spotted. Root cause:
-- migration 919/923 set he_eggs/je_eggs/te_eggs/be_eggs/le_eggs on the
-- FLOCK-LEVEL (shed_id=NULL) rows for 2025-11-02..11-19 and 2025-12-01..2026-05-31,
-- and migration 927 then ALSO set the same egg-type counts on the PER-SHED
-- rows for the overlapping 2025-12-01..2026-05-31 window -- so reports that
-- sum across all rows for a flock+date (not deduplicated by shed_id) count
-- the same physical eggs twice.
-- Fix: egg-TYPE counts (he_eggs/je/te/be/le) belong at the PER-SHED level only
-- (matches the app's own real established pattern). The flock-level row's
-- correct, non-duplicating purpose is ONLY the grade breakdown (he_grade_a/b/c),
-- which has no per-shed equivalent. Zero out the egg-type fields on the
-- flock-level rows, leaving grades untouched.
UPDATE public.daily_records
   SET he_eggs = 0, je_eggs = 0, te_eggs = 0, be_eggs = 0, le_eggs = 0
 WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25' AND shed_id IS NULL;

SELECT 'f928_check' AS chk, count(*)::int AS n
  FROM public.daily_records
 WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25'
   AND (he_eggs <> 0 OR je_eggs <> 0 OR te_eggs <> 0 OR be_eggs <> 0 OR le_eggs <> 0);

SELECT 'f928_grades_intact' AS chk,
       string_agg((d.record_date::text || ' a=' || he_grade_a || ' b=' || he_grade_b), ' | ' ORDER BY d.record_date) AS rows
  FROM (
    SELECT * FROM public.daily_records
     WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25'
     ORDER BY record_date LIMIT 3
  ) d;
