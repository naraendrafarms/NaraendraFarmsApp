-- Migration 920 (READ ONLY): verify the egg-grade import count and check for
-- any overlap/duplication with the 95 pre-existing flock-level rows.
SELECT 'f919_count' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_EGGGRADE_IMPORT_2026-08-25';

SELECT 'f919_dupe_check' AS chk, count(*)::int AS n
  FROM (
    SELECT d.record_date FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no::text='20' AND d.shed_id IS NULL
    GROUP BY d.record_date HAVING count(*) > 1
  ) x;
