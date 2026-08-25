-- Migration 921: mark the grade-wise HE import task done, and correct its
-- description now that it's actually complete.
UPDATE public.tasks
   SET status = 'done', completed_at = now(),
       description = 'DONE. Imported 200 flock-level (shed_id=NULL) daily_records rows from Flock_20.xlsx''s "Egg" sheet Received columns (he_grade_a/b/c, je/te/be/le_eggs, wastage_eggs), covering the two real gaps not already in the app: 2025-11-02 to 2025-11-19 (18 rows) and 2025-12-01 to 2026-05-31 (182 rows). Verified: 0 duplicates against the 95 pre-existing flock-level rows the app already had (2025-11-20 to 2025-11-30, and 2026-06-01 to 2026-08-23). Dispatch/opening-stock (he_dispatch, egg_opening_stock) still not imported -- tied to the separate HE Sales import you are waiting on.'
 WHERE title = 'Flock 20: grade-wise hatching egg import (HE Grade sheet) not done' AND task_type = 'development';

SELECT 'task_updated' AS chk, count(*)::int AS n FROM public.tasks
 WHERE title = 'Flock 20: grade-wise hatching egg import (HE Grade sheet) not done' AND status = 'done';
