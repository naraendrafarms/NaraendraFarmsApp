-- Migration 785: the weekly body weights from the two REARING-BW sheets.
--
-- Body weight is the ONLY part of those workbooks the app cannot work out for
-- itself. Depletion and feed were checked against the daily records first and
-- they agree week for week (see the note below), so importing them would have
-- created a second, competing copy of figures the farm already enters daily.
--
-- Weeks are counted the way the sheet counts them: day 1 is the day AFTER
-- placement, so week 1 ends on placement + 7. Flock 22 was placed 05-May-2026
-- and its sheet dates week 1 as 12-May, which is that rule exactly.
--
-- Flock 23's sheet carries LAST YEAR's dates (07-Jun-2025 onward) against a
-- flock placed 05-Aug-2026 -- a template that was never re-dated. The week
-- numbers are right, so the dates are computed from the placement date rather
-- than imported.
--
-- Uniformity and CV are blank in both sheets, so nothing is written for them
-- rather than writing a zero that would read as a measured value.

INSERT INTO public.flock_weekly_performance (flock_id, week_of_age, sex, week_ending, avg_body_weight_g, remarks)
SELECT f.id, v.wk, v.sex, f.placement_date + (v.wk * 7), v.bw, 'Imported from weekly report'
FROM (VALUES
  ('22', 1,'Female',134),('22', 1,'Male',142),
  ('22', 2,'Female',277),('22', 2,'Male',344),
  ('22', 3,'Female',483),('22', 3,'Male',706),
  ('22', 4,'Female',637),('22', 4,'Male',868),
  ('22', 5,'Female',710),('22', 5,'Male',946),
  ('22', 6,'Female',856),('22', 6,'Male',1131),
  ('22', 7,'Female',898),('22', 7,'Male',1167),
  ('22', 8,'Female',1111),('22', 8,'Male',1419),
  ('22', 9,'Female',1242),('22', 9,'Male',1584),
  ('22',10,'Female',1382),('22',10,'Male',1706),
  ('22',11,'Female',1476),('22',11,'Male',1850),
  ('22',12,'Female',1580),('22',12,'Male',2020),
  ('22',13,'Female',1614),('22',13,'Male',2121),
  ('22',14,'Female',1703),('22',14,'Male',2236),
  ('23', 1,'Female',151),('23', 1,'Male',176)
) AS v(flock_no, wk, sex, bw)
JOIN public.flocks f ON f.flock_no::text = v.flock_no
ON CONFLICT (flock_id, week_of_age, sex) DO UPDATE
  SET avg_body_weight_g = EXCLUDED.avg_body_weight_g,
      week_ending = EXCLUDED.week_ending;

SELECT 'imported' AS chk,
       (SELECT count(*) FROM public.flock_weekly_performance) AS rows_total,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' ' || w.sex || ' weeks=' || count(*)
                 || ' first=' || min(w.week_of_age) || ' last=' || max(w.week_of_age)
                 || ' lastBW=' || max(w.avg_body_weight_g) AS t
            FROM public.flock_weekly_performance w
            JOIN public.flocks f ON f.id = w.flock_id
           GROUP BY f.flock_no, w.sex
       ) x) AS per_flock;
