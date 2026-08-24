-- Migration 818: import the rearing (growing-phase) depletion standard,
-- weeks 1-23, from the REARING DEPLETION sheet of the uploaded weekly
-- reports (WEEKLY_REPORT_NF_19.xlsx and NF_20.xlsx). Verified identical
-- week-by-week between the two files (Flock 19 = Summer, Flock 20 = Winter),
-- so this is one universal curve, not season-specific -- applied to both
-- the Summer and Winter Female Growing rows and the single (season='Both')
-- Male Growing rows. breed_standard had no depletion column at all before
-- this; the column is added here.

ALTER TABLE public.breed_standard ADD COLUMN IF NOT EXISTS cum_depletion_pct NUMERIC(6,3);

WITH std(wk, fem_pct, male_pct) AS (
  VALUES
    (1, 0.5, 0.8), (2, 0.8, 1.5), (3, 1.0, 2.15), (4, 1.2, 2.75), (5, 1.4, 3.25),
    (6, 1.6, 3.65), (7, 1.8, 3.95), (8, 2.0, 4.25), (9, 2.2, 4.55), (10, 2.4, 4.85),
    (11, 2.6, 5.15), (12, 2.8, 5.45), (13, 3.0, 5.75), (14, 3.2, 6.05), (15, 3.4, 6.35),
    (16, 3.6, 6.6), (17, 3.8, 6.8), (18, 4.0, 7.0), (19, 4.2, 7.2), (20, 4.4, 7.4),
    (21, 4.6, 7.6), (22, 4.8, 7.8), (23, 5.0, 8.0)
)
UPDATE public.breed_standard b
   SET cum_depletion_pct = CASE WHEN b.sex = 'Female' THEN s.fem_pct ELSE s.male_pct END
  FROM std s
 WHERE b.phase = 'Growing' AND b.week_of_age = s.wk
   AND ((b.sex = 'Female' AND b.season IN ('Summer','Winter')) OR (b.sex = 'Male' AND b.season = 'Both'));

SELECT 'imported' AS chk, season, sex,
       count(*) FILTER (WHERE cum_depletion_pct IS NOT NULL) AS populated,
       count(*) AS total
  FROM public.breed_standard
 WHERE phase = 'Growing'
 GROUP BY season, sex
 ORDER BY season, sex;
