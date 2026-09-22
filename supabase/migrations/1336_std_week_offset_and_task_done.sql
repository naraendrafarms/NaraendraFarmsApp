-- Two things.
--
-- 1. MEASURE the week-numbering offset. The Weekly tab numbers the placement
--    week as Week 0 (flockAgeWeekBucket = floor(days/7)). The vs Standard tab
--    numbers the same seven days as week 1 (flockAgeWeeks + 1). The comments in
--    the two files each claim to be the one that matches the Venco curve, so
--    one of them is wrong. The Venco curve starts laying at week 24, so the
--    week the flock's first real production appears settles it.
--    READ ONLY - a plain SELECT.
--
-- 2. Mark the Flock Lifetime decision done: the owner said to keep the columns.
--    This UPDATEs a live row, so the row is COPIED FIRST, in this migration,
--    before the write.

-- ── 1. read only ────────────────────────────────────────────────────────────
SELECT string_agg(line, ' || ' ORDER BY flock_no) AS first_lay_week
FROM (
  SELECT f.flock_no,
         'F-' || f.flock_no || ' ' || f.laying_season
           || ' bucket0_firstEgg=' || COALESCE(MIN(((d.record_date - f.placement_date) / 7))
                FILTER (WHERE COALESCE(d.total_eggs, 0) > 0)::text, '-')
           || ' bucket0_firstRealLay=' || COALESCE(MIN(((d.record_date - f.placement_date) / 7))
                FILTER (WHERE COALESCE(d.total_eggs, 0) > COALESCE(d.opening_female, 0) * 0.05)::text, '-')
           AS line
    FROM public.flocks f
    JOIN public.daily_records d ON d.flock_id = f.id
   WHERE f.laying_season IS NOT NULL
   GROUP BY f.flock_no, f.laying_season
) s;

-- ── 2. backup BEFORE the write ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks_backup_1336 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Decide whether the HE-eggs columns added to Flock Lifetime stay';

UPDATE public.tasks
   SET status = 'done'
 WHERE task_type = 'development'
   AND title = 'Decide whether the HE-eggs columns added to Flock Lifetime stay'
   AND status <> 'done';

SELECT left(title, 50) AS title, status FROM public.tasks
 WHERE task_type = 'development'
   AND title = 'Decide whether the HE-eggs columns added to Flock Lifetime stay';
