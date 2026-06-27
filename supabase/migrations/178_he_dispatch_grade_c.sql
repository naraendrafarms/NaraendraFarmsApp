-- Migration 178: Add missing grade_c column to he_dispatch
-- The HE Dispatch save form writes grade_a, grade_b AND grade_c, but the
-- he_dispatch table only ever had grade_a + grade_b (grade_c lived only in
-- he_dispatch_lines). This caused "Could not find the 'grade_c' column of
-- 'he_dispatch'" on invoice save. Add it (default 0).

ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS grade_c INTEGER DEFAULT 0;

-- Backfill grade_c on existing dispatches from their lines (best-effort)
UPDATE public.he_dispatch d
SET grade_c = COALESCE(s.gc, 0)
FROM (
  SELECT dispatch_id, SUM(grade_c) AS gc
  FROM public.he_dispatch_lines GROUP BY dispatch_id
) s
WHERE s.dispatch_id = d.id
  AND COALESCE(d.grade_c, 0) = 0;

-- Verify
SELECT COUNT(*) AS dispatches, COUNT(grade_c) AS with_grade_c FROM public.he_dispatch;
