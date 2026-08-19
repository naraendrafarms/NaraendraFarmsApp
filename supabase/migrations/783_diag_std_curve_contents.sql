-- Migration 783 (READ ONLY): std_production_curve exists and carries the
-- laying standard including cum_depletion_pct. Before saying anything else
-- about what is or is not in the app, read what it actually HOLDS -- how many
-- weeks, which seasons, and whether the depletion column is populated or
-- merely present.

SELECT 'curve' AS chk,
       (SELECT count(*) FROM public.std_production_curve) AS rows_total,
       (SELECT string_agg(DISTINCT season, ' , ') FROM public.std_production_curve) AS seasons,
       (SELECT min(week_of_age) || '..' || max(week_of_age) FROM public.std_production_curve) AS week_range,
       (SELECT count(*) FROM public.std_production_curve WHERE cum_depletion_pct IS NOT NULL) AS with_depletion,
       (SELECT count(*) FROM public.std_production_curve WHERE std_production_pct IS NOT NULL) AS with_production,
       (SELECT count(*) FROM public.std_production_curve WHERE he_pct IS NOT NULL) AS with_he_pct,
       (SELECT count(*) FROM public.std_production_curve WHERE hatch_pct IS NOT NULL) AS with_hatch;

SELECT 'curve_sample' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT lpad(week_of_age::text, 2, '0') || ' ' || season
                 || ' dep=' || COALESCE(cum_depletion_pct::text, '-')
                 || ' prod=' || COALESCE(std_production_pct::text, '-')
                 || ' he=' || COALESCE(he_pct::text, '-')
                 || ' hatch=' || COALESCE(hatch_pct::text, '-') AS t
            FROM public.std_production_curve
           WHERE week_of_age <= 6 OR week_of_age IN (24, 30, 40, 60)
       ) x) AS sample;

-- Growing-phase depletion: is there a weekly standard for the REARING period
-- anywhere, or does the curve only start at laying age?
SELECT 'growing' AS chk,
       (SELECT count(*) FROM public.std_production_curve WHERE week_of_age <= 20) AS curve_weeks_upto_20,
       (SELECT count(*) FROM public.breed_standard WHERE phase = 'Growing') AS breed_std_growing_rows,
       (SELECT min(week_of_age) || '..' || max(week_of_age) FROM public.breed_standard WHERE phase = 'Growing') AS growing_weeks,
       (SELECT min(week_of_age) || '..' || max(week_of_age) FROM public.breed_standard WHERE phase = 'Laying') AS laying_weeks;
