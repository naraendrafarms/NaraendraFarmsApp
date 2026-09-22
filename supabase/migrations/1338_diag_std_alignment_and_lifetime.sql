-- READ ONLY.  No INSERT, UPDATE, DELETE or DDL.
--
-- 1337 statements 1 and 2 silently did nothing: flocks.flock_no is TEXT and
-- they compared it to an integer, which raises "operator does not exist" -
-- a phrase run_sql.py counts as SUCCESS. Quoted here.
--
-- a) actual hen-day % by bucket (bucket = floor(days since placement / 7), the
--    Weekly tab's own numbering) around the start of lay, so the real ramp can
--    be laid against the curve's ramp and the week numbering settled;
-- b) the LIFETIME standard per hen housed, for the top line on the flock page.

SELECT 'F19 Summer actual HD by bucket: '
    || COALESCE(string_agg(bucket || '=' || hd, ' ' ORDER BY bucket), 'none') AS f19
FROM (
  SELECT ((d.record_date - f.placement_date) / 7) AS bucket,
         ROUND(SUM(COALESCE(d.total_eggs,0))::numeric
               / NULLIF(SUM(COALESCE(d.opening_female,0)), 0) * 100, 1)::text AS hd
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   WHERE f.flock_no = '19'
     AND ((d.record_date - f.placement_date) / 7) BETWEEN 22 AND 29
   GROUP BY 1
) x;

SELECT 'F20 Winter actual HD by bucket: '
    || COALESCE(string_agg(bucket || '=' || hd, ' ' ORDER BY bucket), 'none') AS f20
FROM (
  SELECT ((d.record_date - f.placement_date) / 7) AS bucket,
         ROUND(SUM(COALESCE(d.total_eggs,0))::numeric
               / NULLIF(SUM(COALESCE(d.opening_female,0)), 0) * 100, 1)::text AS hd
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   WHERE f.flock_no = '20'
     AND ((d.record_date - f.placement_date) / 7) BETWEEN 22 AND 29
   GROUP BY 1
) x;

-- The lifetime figures: the LAST cumulative value the curve carries, which is
-- what "how many eggs per bird should this flock give in total" means.
SELECT string_agg(line, '  ||  ' ORDER BY season) AS lifetime_std
FROM (
  SELECT c.season,
         c.season || ': last week=' || c.week_of_age
           || ' cum TE/hen=' || COALESCE(c.cum_te_hh::text, 'null')
           || ' cum HE/hen=' || COALESCE(c.cum_he_hh::text, 'null')
           || ' cum chicks/hen=' || COALESCE(c.cum_chicks_hh::text, 'null')
           || ' cum depletion=' || COALESCE(c.cum_depletion_pct::text, 'null') || '%'
           || ' firstLayWk=' || COALESCE((SELECT MIN(w.week_of_age)::text
                FROM public.std_production_curve w
               WHERE w.season = c.season AND COALESCE(w.hen_week_pct, 0) > 0), '-')
           AS line
    FROM public.std_production_curve c
   WHERE c.week_of_age = (SELECT MAX(w2.week_of_age) FROM public.std_production_curve w2
                           WHERE w2.season = c.season)
) s;
