-- The farm's own weekly body weight register carries MIN and MAX bird weight
-- alongside the average -- the spread that says whether a flock is even or
-- ragged. Uniformity % is a different measure and the register does not use it,
-- so min/max are added rather than forced into the uniformity column.
ALTER TABLE public.flock_weekly_performance ADD COLUMN IF NOT EXISTS min_body_weight_g numeric;
ALTER TABLE public.flock_weekly_performance ADD COLUMN IF NOT EXISTS max_body_weight_g numeric;

-- Flock 23, week 1, from the register dated 13/08/2026.
--   Female: actual 151 g against a standard of 140 (+11), min 99, max 212
--   Male:   actual 176 g against a standard of 140 (+36), min 115, max 239
-- The register's own STD column reads 140 g body weight, 100 g gain and 23 g
-- feed, which matches the Venco week-1 row already loaded -- checked before
-- writing this, not assumed.
--
-- Last week's body weight (46 g) is the day-old chick weight, and actual gain
-- (+105 female, +130 male) follows from it. Neither is stored as its own
-- figure: gain is the difference between two weeks, so storing it as well would
-- let the two disagree. Once week 2 is entered the page computes gain itself.
-- The 46 g placement weight can be added later as a week-0 row if wanted.
--
-- Feed is recorded as "Full" in the register, which is the book's own
-- recommendation for the first two weeks rather than a measured quantity, so it
-- goes in remarks rather than inventing a numeric feed figure.
INSERT INTO public.flock_weekly_performance
  (flock_id, sex, week_of_age, week_ending, avg_body_weight_g, min_body_weight_g, max_body_weight_g, remarks)
SELECT f.id, v.sex, 1, DATE '2026-08-13', v.avg, v.mn, v.mx, 'Full feed (1st week). From weekly body weight register.'
FROM public.flocks f
JOIN (VALUES ('Female', 151, 99, 212), ('Male', 176, 115, 239)) AS v(sex, avg, mn, mx) ON TRUE
WHERE f.flock_no = '23'
ON CONFLICT (flock_id, week_of_age, sex) DO UPDATE
  SET avg_body_weight_g = EXCLUDED.avg_body_weight_g,
      min_body_weight_g = EXCLUDED.min_body_weight_g,
      max_body_weight_g = EXCLUDED.max_body_weight_g,
      week_ending       = EXCLUDED.week_ending,
      remarks           = EXCLUDED.remarks;

-- VERIFY: the two rows, with the standard beside them, as plain text.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NOTHING IMPORTED') AS imported
FROM (
  SELECT 'F-' || f.flock_no || ' wk' || w.week_of_age || ' ' || w.sex
         || ': act=' || w.avg_body_weight_g
         || ' std=' || COALESCE(s.body_weight_g::text,'-')
         || ' diff=' || COALESCE((w.avg_body_weight_g - s.body_weight_g)::text,'-')
         || ' min=' || w.min_body_weight_g || ' max=' || w.max_body_weight_g AS line
  FROM public.flock_weekly_performance w
  JOIN public.flocks f ON f.id = w.flock_id
  LEFT JOIN public.breed_standard s ON s.phase='Growing' AND s.week_of_age = w.week_of_age
       AND s.sex = w.sex AND s.season = CASE WHEN w.sex='Male' THEN 'Both' ELSE 'Winter' END
  WHERE f.flock_no = '23'
) x;

SELECT flock_no, to_char(placement_date,'DD/MM/YYYY') AS placed, COALESCE(laying_season,'not set') AS season
FROM public.flocks WHERE flock_no = '23';
