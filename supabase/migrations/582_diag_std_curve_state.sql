-- Diagnostic only (no schema changes).
-- Before loading a breed standard, establish what is already there: the
-- Monthly Production Review and the vs-Standard tab both read this table, and
-- overwriting existing rows with a different source would silently change
-- every deviation figure in both.

SELECT COALESCE(string_agg(DISTINCT season || '/' || COALESCE(breed,'(no breed)'), ', '), 'EMPTY') AS seasons_breeds
FROM public.std_production_curve;

SELECT COUNT(*) AS total_rows,
       MIN(week_of_age) AS first_week,
       MAX(week_of_age) AS last_week,
       COUNT(hen_week_pct) AS with_hd_std,
       COUNT(he_pct) AS with_he_std,
       COUNT(cum_depletion_pct) AS with_mortality_std,
       COUNT(hatch_pct) AS with_hatch_std,
       COUNT(cum_te_hh) AS with_cum_te_hh,
       COUNT(cum_he_hh) AS with_cum_he_hh
FROM public.std_production_curve;

-- A sample, so the shape of whatever exists is visible rather than assumed.
SELECT season, breed, week_of_age, std_production_pct, hen_week_pct, he_pct,
       cum_depletion_pct, hatch_pct, cum_te_hh, cum_he_hh
FROM public.std_production_curve
ORDER BY season, week_of_age
LIMIT 12;

-- Which flocks would be compared against it, and what season they carry.
SELECT COALESCE(string_agg(flock_no || '=' || COALESCE(laying_season,'(none)'), ', ' ORDER BY flock_no), 'none') AS flock_seasons
FROM public.flocks WHERE status <> 'closed';
