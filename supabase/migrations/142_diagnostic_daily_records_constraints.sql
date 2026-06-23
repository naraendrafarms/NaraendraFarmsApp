-- Migration 142: Diagnostic — check daily_records constraints and grade data

-- 1. Unique constraints on daily_records
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.daily_records'::regclass
  AND contype IN ('u','p');

-- 2. Unique indexes on daily_records
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'daily_records' AND schemaname = 'public'
  AND indexdef ILIKE '%unique%';

-- 3. Any rows with he_grade_a/b/c set?
SELECT id, flock_id, shed_id, record_date, he_grade_a, he_grade_b, he_grade_c
FROM public.daily_records
WHERE he_grade_a IS NOT NULL OR he_grade_b IS NOT NULL OR he_grade_c IS NOT NULL
ORDER BY record_date DESC
LIMIT 10;

-- 4. Count of rows per shed_id (null vs not-null) for recent date
SELECT shed_id IS NULL AS flock_level, COUNT(*) AS cnt
FROM public.daily_records
GROUP BY flock_level;
