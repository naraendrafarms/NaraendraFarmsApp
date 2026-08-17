-- Diagnostic only. 671 reported Errors: 0 but printed none of its verify
-- SELECTs (27,000-char file, output truncated), and green alone is not proof.
-- Same checks, run on their own so the answers are actually visible.

-- VERIFY 5: 201 rows, split as expected.
SELECT COUNT(*)::text AS rows_loaded,
       COALESCE(string_agg(DISTINCT season||'/'||sex||'/'||phase, ', '), '-') AS groups
FROM public.breed_standard;

-- VERIFY 6: spot-check against the images --
--   Female Summer Growing wk1 body weight 140, wk24 3040
--   Female Winter Laying wk24 feed 116, wk66 body weight 4160
--   Summer egg table wk30 hatchability 84.0, Winter wk30 hatchability 80.0
SELECT (SELECT body_weight_g FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Growing' AND week_of_age=1)::text AS f_sum_grow_wk1_bw,
       (SELECT body_weight_g FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Growing' AND week_of_age=24)::text AS f_sum_grow_wk24_bw,
       (SELECT feed_g_per_day FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=24)::text AS f_win_lay_wk24_feed,
       (SELECT body_weight_g FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=66)::text AS f_win_lay_wk66_bw,
       (SELECT hatchability_pct FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Laying' AND week_of_age=30)::text AS sum_wk30_hatchability,
       (SELECT hatchability_pct FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=30)::text AS win_wk30_hatchability;

-- VERIFY 7: THE QUESTION ASKED -- is the STD Hatch % being typed on each hatch
-- batch the same as the breed standard for that flock's age and season?
--
-- Matched on: the flock's laying_season (F-19 Summer, F-20 Winter), and the
-- flock's age in WEEKS at the setting date, rounded to the nearest whole week
-- because the standard is published per week. Batches whose flock has no
-- placement date, or whose age falls outside 24-66 weeks, cannot be compared
-- and are counted separately rather than silently dropped.
WITH b AS (
  SELECT hb.id, hb.std_hatch_pct,
         ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk,
         f.laying_season, f.flock_no
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
), j AS (
  SELECT b.*, s.hatchability_pct AS std_hatch, s.hatch_of_fertile_pct AS std_hof
  FROM b LEFT JOIN public.breed_standard s
    ON s.sex='Female' AND s.phase='Laying' AND s.season = b.laying_season AND s.week_of_age = b.wk
)
SELECT COUNT(*)::text AS batches,
       COUNT(*) FILTER (WHERE std_hatch IS NULL)::text AS no_standard_for_that_age,
       COUNT(*) FILTER (WHERE std_hatch_pct IS NULL)::text AS no_std_hatch_pct_typed,
       COUNT(*) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL
                          AND ABS(std_hatch_pct - std_hatch) < 0.05)::text AS matches_the_standard,
       COUNT(*) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL
                          AND ABS(std_hatch_pct - std_hatch) >= 0.05)::text AS differs_from_standard,
       COALESCE(ROUND(AVG(std_hatch_pct - std_hatch) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL), 2)::text, '-') AS avg_typed_minus_standard
FROM j;

-- VERIFY 8: the same, per flock, so a flock entered differently stands out.
WITH b AS (
  SELECT hb.std_hatch_pct, ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk,
         f.laying_season, f.flock_no
  FROM public.hatch_batches hb JOIN public.flocks f ON f.id = hb.flock_id
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
)
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS per_flock
FROM (
  SELECT 'F-' || b.flock_no || ' (' || COALESCE(b.laying_season,'no season') || ')'
         || ' n=' || COUNT(*)
         || ' wks=' || MIN(b.wk) || '-' || MAX(b.wk)
         || ' typed_avg=' || COALESCE(ROUND(AVG(b.std_hatch_pct),2)::text,'-')
         || ' std_avg=' || COALESCE(ROUND(AVG(s.hatchability_pct),2)::text,'-')
         || ' diff=' || COALESCE(ROUND(AVG(b.std_hatch_pct - s.hatchability_pct),2)::text,'-') AS line
  FROM b LEFT JOIN public.breed_standard s
    ON s.sex='Female' AND s.phase='Laying' AND s.season=b.laying_season AND s.week_of_age=b.wk
  GROUP BY b.flock_no, b.laying_season
) x;
