-- Diagnostic only, before importing the 1st-week body weight register for
-- flock 23 (dated 13/08/26).
--
-- The register's own STD column reads 140 g body weight, 100 g gain and 23 g
-- feed for week 1 -- so it can be checked against what was loaded from the
-- Venco book rather than taken on trust.

-- 1. Does flock 23 exist, and what is its placement date and season? Week 1 of
--    a flock placed in August falls in WINTER brooding by the book's own
--    definition (Aug-Jan), which is a different table from summer.
SELECT COALESCE(string_agg('F-' || flock_no || ' placed=' || COALESCE(to_char(placement_date,'DD/MM/YYYY'),'none')
       || ' season=' || COALESCE(laying_season,'not set')
       || ' breed=' || COALESCE(breed,'-'), ' | ' ORDER BY flock_no), 'NOT FOUND') AS flock_23
FROM public.flocks WHERE flock_no ILIKE '%23%';

-- 2. What the app holds as the week-1 standard, both seasons and both sexes.
--    Compare against the register's STD: bwt 140, gain 100, feed 23.
SELECT COALESCE(string_agg(season || '/' || sex || ': bwt=' || COALESCE(body_weight_g::text,'-')
       || ' gain=' || COALESCE(weekly_gain_g::text,'-')
       || ' feed=' || COALESCE(feed_g_per_day::text,'-')
       || ' type=' || COALESCE(feed_type,'-'), ' | ' ORDER BY sex, season), 'NONE') AS week1_standard
FROM public.breed_standard WHERE week_of_age = 1 AND phase = 'Growing';

-- 3. Is anything already recorded for flock 23 in the new weekly table?
SELECT COUNT(*)::text AS rows_for_flock_23
FROM public.flock_weekly_performance w
JOIN public.flocks f ON f.id = w.flock_id
WHERE f.flock_no ILIKE '%23%';

-- 4. All flocks, so the right one is picked rather than assumed from a number
--    that happens to contain 23.
SELECT COALESCE(string_agg(flock_no, ', ' ORDER BY flock_no), 'NONE') AS all_flock_numbers
FROM public.flocks WHERE COALESCE(is_vhl_contract,false) = false;
