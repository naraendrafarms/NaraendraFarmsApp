-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- "As per the eggs std table, how many HE eggs should we be receiving?"
-- std_production_curve holds weekly_he_hh and cum_he_hh - hatching eggs per
-- hen housed - so the expected figure is derivable. Measure what the table
-- actually holds and what it implies for the flocks now laying.

-- 1. What the standard table holds
SELECT season,
       count(*)::int AS weeks,
       min(week_of_age)::int AS from_week,
       max(week_of_age)::int AS to_week,
       count(weekly_he_hh)::int AS weeks_with_weekly_he,
       count(cum_he_hh)::int AS weeks_with_cum_he,
       round(max(cum_he_hh)::numeric, 1) AS lifetime_he_per_hen
FROM public.std_production_curve
GROUP BY season ORDER BY season;

-- 2. Every flock currently laying: age, birds, and what the book says it
--    should be producing this week. Hens housed is what the standard is per,
--    so the placed female count is the right multiplier, not today's count.
SELECT f.flock_no,
       COALESCE(f.status,'-') AS status,
       f.placement_date::text AS placed,
       (floor((CURRENT_DATE - f.placement_date) / 7.0) + 1)::int AS age_weeks,
       COALESCE(f.laying_season, '(not set)') AS season,
       round(COALESCE(f.total_placed_f,0))::int AS hens_housed,
       round(s.hen_week_pct::numeric, 1) AS std_hen_week_pct,
       round(s.he_pct::numeric, 1) AS std_he_pct,
       round(s.weekly_he_hh::numeric, 2) AS std_weekly_he_per_hen,
       round((COALESCE(f.total_placed_f,0) * s.weekly_he_hh)::numeric)::int AS std_he_this_week,
       round((COALESCE(f.total_placed_f,0) * s.cum_he_hh)::numeric)::int AS std_he_to_date
FROM public.flocks f
LEFT JOIN public.std_production_curve s
  ON s.season = f.laying_season
 AND s.week_of_age = (floor((CURRENT_DATE - f.placement_date) / 7.0) + 1)::int
WHERE COALESCE(f.status,'') <> 'closed'
  AND f.placement_date IS NOT NULL
ORDER BY f.flock_no;

-- 3. What actually came in over the last 7 days, to sit beside it
SELECT d.flock_id,
       f.flock_no,
       round(sum(COALESCE(d.he_eggs,0)))::int AS he_last_7d,
       round(sum(COALESCE(d.total_eggs,0)))::int AS total_eggs_last_7d,
       round(sum(COALESCE(d.he_eggs,0)) * 100.0
             / NULLIF(sum(COALESCE(d.total_eggs,0)),0), 1) AS actual_he_pct
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
WHERE d.record_date > CURRENT_DATE - 7
GROUP BY d.flock_id, f.flock_no ORDER BY f.flock_no;

-- 4. Is laying_season actually set? Without it the join above finds nothing.
SELECT count(*)::int AS flocks,
       count(*) FILTER (WHERE COALESCE(status,'') <> 'closed')::int AS open_flocks,
       count(*) FILTER (WHERE laying_season IS NOT NULL)::int AS with_laying_season,
       COALESCE(string_agg(DISTINCT COALESCE(laying_season,'(null)'), ', '), '-') AS seasons_used
FROM public.flocks;
