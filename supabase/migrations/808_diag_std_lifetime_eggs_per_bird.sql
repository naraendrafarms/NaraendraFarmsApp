-- Migration 808 (READ ONLY): what our OWN standard (std_production_curve)
-- says a bird should lay lifetime -- Total Eggs/bird and Hatching Eggs/bird
-- -- summed week by week (weeks 24-66, the only range the standard covers;
-- there is no standard for weeks 1-23, so this is laying-period only, not a
-- full 1-68 week figure like the Hitech report's "Egg Input per bird").
--
-- hen_week_pct is hen-day % for that week -> eggs/bird that week = pct/100*7
-- he_pct is the HE share of total production that week.

SELECT season, count(*) AS weeks,
       round(sum(hen_week_pct/100.0*7)::numeric, 2) AS total_eggs_per_bird_w24_66,
       round(sum(hen_week_pct/100.0*7 * he_pct/100.0)::numeric, 2) AS hatching_eggs_per_bird_w24_66,
       min(week_of_age) AS from_week, max(week_of_age) AS to_week
  FROM public.std_production_curve
 GROUP BY season
 ORDER BY season;

-- Same, split into rolling ranges (e.g. up to week 40, 50, 66) so a partial
-- flock (not yet at week 66) can be compared against the standard for
-- however far it has gone -- rather than only the full-life total.
SELECT season,
       round(sum(hen_week_pct/100.0*7) FILTER (WHERE week_of_age <= 40)::numeric,2) AS eggs_to_w40,
       round(sum(hen_week_pct/100.0*7) FILTER (WHERE week_of_age <= 50)::numeric,2) AS eggs_to_w50,
       round(sum(hen_week_pct/100.0*7) FILTER (WHERE week_of_age <= 66)::numeric,2) AS eggs_to_w66,
       round(sum(hen_week_pct/100.0*7*he_pct/100.0) FILTER (WHERE week_of_age <= 40)::numeric,2) AS he_to_w40,
       round(sum(hen_week_pct/100.0*7*he_pct/100.0) FILTER (WHERE week_of_age <= 50)::numeric,2) AS he_to_w50,
       round(sum(hen_week_pct/100.0*7*he_pct/100.0) FILTER (WHERE week_of_age <= 66)::numeric,2) AS he_to_w66
  FROM public.std_production_curve
 GROUP BY season
 ORDER BY season;
