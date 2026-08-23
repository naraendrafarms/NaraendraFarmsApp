-- Migration 809 (READ ONLY): reproduce the Hitech-style Production /
-- Selection / Feed / Mortality actual-vs-standard numbers for Flock 19, using
-- real data only. P&L is NOT computed here -- that calculation lives in
-- FlockPLSummary.tsx (recipe-costed feed, stock-rated medicine, alias-matched
-- ingredient prices) and re-deriving it by hand in SQL risks getting it
-- wrong; the app's own Flock P&L Summary page, filtered to Flock 19, is the
-- correct source for that figure.

SELECT 'f19_basics' AS chk,
       f.flock_no, f.placement_date, f.laying_season, f.rearing_season, f.status,
       f.total_placed_f, f.total_placed_m,
       (CURRENT_DATE - f.placement_date) AS days_old,
       floor((CURRENT_DATE - f.placement_date)/7)+1 AS current_week
  FROM public.flocks f WHERE f.flock_no::text = '19';

SELECT 'f19_actuals' AS chk,
       sum(d.total_eggs) AS total_eggs_actual,
       sum(d.he_eggs) AS he_eggs_actual,
       sum(d.mortality_female + d.mortality_male) AS mortality_actual,
       sum(COALESCE(d.feed_female_kg,0) + COALESCE(d.feed_male_kg,0)) AS feed_kg_actual,
       count(DISTINCT d.record_date) AS days_recorded,
       min(d.record_date) AS first_record, max(d.record_date) AS last_record
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19';

-- Standard, matched to the flock's own laying_season, summed only over the
-- weeks the flock has actually lived through so far (not the full 66).
SELECT 'f19_std_to_date' AS chk,
       f.laying_season,
       floor((CURRENT_DATE - f.placement_date)/7)+1 AS current_week,
       round(sum(s.hen_week_pct/100.0*7) FILTER (WHERE s.week_of_age <= floor((CURRENT_DATE - f.placement_date)/7)+1)::numeric,2) AS std_eggs_per_bird_to_date,
       round(sum(s.hen_week_pct/100.0*7*s.he_pct/100.0) FILTER (WHERE s.week_of_age <= floor((CURRENT_DATE - f.placement_date)/7)+1)::numeric,2) AS std_he_per_bird_to_date,
       f.total_placed_f
  FROM public.flocks f
  LEFT JOIN public.std_production_curve s ON s.season = f.laying_season
 WHERE f.flock_no::text = '19'
 GROUP BY f.laying_season, f.placement_date, f.total_placed_f;
