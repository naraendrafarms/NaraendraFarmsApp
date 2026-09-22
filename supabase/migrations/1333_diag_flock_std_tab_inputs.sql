-- 1333  READ ONLY.  Nothing is written: no INSERT, no UPDATE, no DELETE, no DDL.
--
-- Question: the flock page (Flock Management > All Flocks (Data) > open a flock)
-- already has a "vs Standard" tab.  It is gated on flocks.laying_season being
-- set AND on std_production_curve holding rows for that season.  For which
-- flocks does that tab actually draw a table, and over which weeks?
--
-- One SELECT, compact text, because run_sql.py previews only the first five
-- rows of the first five statements and truncates at 600 chars.

SELECT string_agg(line, ' || ' ORDER BY flock_no) AS flock_std_tab_readiness
FROM (
  SELECT f.flock_no,
         'F-' || f.flock_no
           || ' season=' || COALESCE(f.laying_season, 'NONE')
           || ' placedF=' || COALESCE(f.total_placed_f, 0)
           || ' wkNow=' || (((CURRENT_DATE - f.placement_date) / 7) + 1)
           || ' curve=' || COALESCE((SELECT COUNT(*)::text FROM public.std_production_curve c
                                      WHERE c.season = f.laying_season), '0')
           || 'rows/wk' || COALESCE((SELECT MIN(c.week_of_age)::text FROM public.std_production_curve c
                                      WHERE c.season = f.laying_season), '-')
           || '-' || COALESCE((SELECT MAX(c.week_of_age)::text FROM public.std_production_curve c
                                WHERE c.season = f.laying_season), '-')
           || ' dataWksInCurve=' || COALESCE((
                SELECT COUNT(DISTINCT (((d.record_date - f.placement_date) / 7) + 1))::text
                  FROM public.daily_records d
                 WHERE d.flock_id = f.id
                   AND (((d.record_date - f.placement_date) / 7) + 1)
                       BETWEEN (SELECT MIN(c.week_of_age) FROM public.std_production_curve c
                                 WHERE c.season = f.laying_season)
                           AND (SELECT MAX(c.week_of_age) FROM public.std_production_curve c
                                 WHERE c.season = f.laying_season)
              ), '0')
           AS line
    FROM public.flocks f
) s;
