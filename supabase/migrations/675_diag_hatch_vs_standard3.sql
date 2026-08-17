-- Diagnostic only. Third attempt, and the first two were silently WRONG rather
-- than silently empty.
--
-- The fault: in Postgres, date - date yields an INTEGER (days), not an interval,
-- so EXTRACT(day FROM hb.setting_date - f.placement_date) raises
-- "function pg_catalog.date_part(unknown, integer) does not exist" -- and
-- run_sql.py treats ANY error containing "does not exist" as SUCCESS. The
-- statement errored, printed nothing, and the run still reported Errors: 0.
-- Exactly the failure mode CLAUDE.md warns about, and it also explains the
-- silent age-band blocks in migrations 661 and 663.
--
-- Correct form: subtract the dates directly and divide by 7.0.
SELECT COUNT(*)::text AS batches,
       COUNT(typed)::text AS have_typed_std_hatch_pct,
       COUNT(std)::text AS have_a_breed_standard,
       COUNT(*) FILTER (WHERE typed IS NOT NULL AND std IS NOT NULL AND ABS(typed-std) < 0.05)::text AS match_the_standard,
       COUNT(*) FILTER (WHERE typed IS NOT NULL AND std IS NOT NULL AND ABS(typed-std) >= 0.05)::text AS differ_from_standard,
       COALESCE(ROUND(AVG(typed-std),2)::text,'-') AS avg_typed_minus_std,
       COALESCE(MIN(wk)::text,'-') || '-' || COALESCE(MAX(wk)::text,'-') AS age_weeks_span
FROM (
  SELECT hb.std_hatch_pct AS typed, s.hatchability_pct AS std,
         ROUND((hb.setting_date - f.placement_date)/7.0)::int AS wk
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND((hb.setting_date - f.placement_date)/7.0)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
) j;

SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS per_flock
FROM (
  SELECT 'F-' || f.flock_no || ' (' || COALESCE(f.laying_season,'no season') || ') n=' || COUNT(*)
         || ' wks=' || MIN(ROUND((hb.setting_date - f.placement_date)/7.0)::int)
         || '-' || MAX(ROUND((hb.setting_date - f.placement_date)/7.0)::int)
         || ' typed=' || COALESCE(ROUND(AVG(hb.std_hatch_pct),2)::text,'-')
         || ' std=' || COALESCE(ROUND(AVG(s.hatchability_pct),2)::text,'-')
         || ' diff=' || COALESCE(ROUND(AVG(hb.std_hatch_pct - s.hatchability_pct),2)::text,'-') AS line
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND((hb.setting_date - f.placement_date)/7.0)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY f.flock_no, f.laying_season
) x;

-- Also: actual hatch achieved against the standard, per flock -- the figure the
-- farm cares about, not just what was typed.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS actual_vs_standard
FROM (
  SELECT 'F-' || f.flock_no || ': actual=' || ROUND(SUM(hb.hatched_chicks)*100.0/NULLIF(SUM(hb.eggs_set),0),2)
         || '% std=' || COALESCE(ROUND(AVG(s.hatchability_pct),2)::text,'-') || '%' AS line
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND((hb.setting_date - f.placement_date)/7.0)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY f.flock_no
) y;
