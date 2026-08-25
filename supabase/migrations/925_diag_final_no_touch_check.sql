-- Migration 925 (READ ONLY): final confirmation -- did the egg-grade import
-- (919) and fix (923) touch ONLY new rows, and leave the 95 pre-existing
-- flock-level rows completely untouched?
SELECT 'existing_95_still_95' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
 WHERE fl.flock_no::text='20' AND d.shed_id IS NULL
   AND d.remarks IS DISTINCT FROM 'F20_EGGGRADE_IMPORT_2026-08-25';

SELECT 'my_new_rows' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25';

SELECT 'any_date_overlap' AS chk, count(*)::int AS n
  FROM (
    SELECT d.record_date FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no::text='20' AND d.shed_id IS NULL
    GROUP BY d.record_date HAVING count(*) > 1
  ) x;
