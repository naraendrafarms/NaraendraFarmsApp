-- READ ONLY.  No INSERT, UPDATE, DELETE or DDL.
--
-- 1336 showed real laying starts at bucket 24 (bucket = floor(days since
-- placement / 7)) on BOTH F-19 and F-20, and the Venco curve starts at week 24.
-- That says bucket N == curve week N, with NO offset - which is what the Weekly
-- tab already does, and the OPPOSITE of what the vs Standard tab does (it adds
-- 1, so it reads curve week 24 against bucket 23).
--
-- Before saying that out loud: line the two shapes up week by week around the
-- start of lay. If the actual ramp matches the curve's ramp at the same number,
-- there is no offset. If it matches one week later, there is.

SELECT 'F-19 Summer  ACTUAL HD%% by bucket: '
    || COALESCE(string_agg(bucket || '=' || hd, ' ' ORDER BY bucket), '-') AS f19_actual
FROM (
  SELECT ((d.record_date - f.placement_date) / 7) AS bucket,
         ROUND(SUM(COALESCE(d.total_eggs,0))::numeric
               / NULLIF(SUM(COALESCE(d.opening_female,0)), 0) * 100, 1)::text AS hd
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   WHERE f.flock_no = 19
     AND ((d.record_date - f.placement_date) / 7) BETWEEN 21 AND 30
   GROUP BY 1
) x;

SELECT 'F-20 Winter  ACTUAL HD%% by bucket: '
    || COALESCE(string_agg(bucket || '=' || hd, ' ' ORDER BY bucket), '-') AS f20_actual
FROM (
  SELECT ((d.record_date - f.placement_date) / 7) AS bucket,
         ROUND(SUM(COALESCE(d.total_eggs,0))::numeric
               / NULLIF(SUM(COALESCE(d.opening_female,0)), 0) * 100, 1)::text AS hd
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   WHERE f.flock_no = 20
     AND ((d.record_date - f.placement_date) / 7) BETWEEN 21 AND 30
   GROUP BY 1
) x;

SELECT 'CURVE hen_week_pct  ' || season || ': '
    || string_agg(week_of_age || '=' || hen_week_pct, ' ' ORDER BY week_of_age) AS curve
FROM public.std_production_curve
WHERE week_of_age BETWEEN 21 AND 30
GROUP BY season;
