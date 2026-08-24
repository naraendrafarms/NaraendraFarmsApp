-- Migration 845 (READ ONLY): verify the 90 imported body-weight rows for Flock 19
-- against real expected values (spot rows + full sanity checks).

SELECT 'f19_bw_count_by_sex' AS chk,
       sex, count(*)::int AS n, min(week_of_age) AS min_wk, max(week_of_age) AS max_wk
  FROM public.flock_weekly_performance p
  JOIN public.flocks f ON f.id = p.flock_id
 WHERE f.flock_no::text = '19'
 GROUP BY sex;

SELECT 'f19_bw_sample' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT ('wk' || week_of_age || ' ' || sex || ' bw=' || avg_body_weight_g
            || 'g we=' || week_ending::text) AS t
      FROM public.flock_weekly_performance p
      JOIN public.flocks f ON f.id = p.flock_id
     WHERE f.flock_no::text = '19' AND week_of_age IN (1,23,24,50,67)
  ) x;

-- Any duplicate (flock_id, week_of_age, sex) -- should be impossible given the
-- unique constraint, but confirms the ON CONFLICT didn't silently double things.
SELECT 'f19_bw_dupes' AS chk, count(*)::int AS n
  FROM (
    SELECT week_of_age, sex, count(*) AS c
      FROM public.flock_weekly_performance p
      JOIN public.flocks f ON f.id = p.flock_id
     WHERE f.flock_no::text = '19'
     GROUP BY week_of_age, sex HAVING count(*) > 1
  ) d;
