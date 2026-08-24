-- Migration 817 (READ ONLY): what Growing-phase rows already exist, by
-- season/sex, before adding a depletion column to fill.
SELECT season, sex, count(*) AS rows, min(week_of_age) AS min_wk, max(week_of_age) AS max_wk
  FROM public.breed_standard
 WHERE phase = 'Growing'
 GROUP BY season, sex
 ORDER BY season, sex;
