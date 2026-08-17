-- Diagnostic only. 673 printed no result at all: run_sql.py emits output only
-- for statements it recognises as SELECTs, and a statement beginning with WITH
-- is not matched, so the answer was computed and thrown away. Same query,
-- written as a plain SELECT over a subquery so the result actually prints.
-- (This also explains the silent verify blocks in 669 and 671.)
SELECT COUNT(*)::text AS batches,
       COUNT(typed)::text AS have_typed_std_hatch_pct,
       COUNT(std)::text AS have_a_breed_standard,
       COUNT(*) FILTER (WHERE typed IS NOT NULL AND std IS NOT NULL AND ABS(typed-std) < 0.05)::text AS match_the_standard,
       COUNT(*) FILTER (WHERE typed IS NOT NULL AND std IS NOT NULL AND ABS(typed-std) >= 0.05)::text AS differ_from_standard,
       COALESCE(ROUND(AVG(typed-std),2)::text,'-') AS avg_typed_minus_std,
       COALESCE(MIN(wk)::text,'-') || '-' || COALESCE(MAX(wk)::text,'-') AS age_weeks_span
FROM (
  SELECT hb.std_hatch_pct AS typed, s.hatchability_pct AS std,
         ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
) j;

-- Per flock, so a flock entered differently stands out.
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS per_flock
FROM (
  SELECT 'F-' || f.flock_no || ' (' || COALESCE(f.laying_season,'no season') || ') n=' || COUNT(*)
         || ' wks=' || MIN(ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int)
         || '-' || MAX(ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int)
         || ' typed_avg=' || COALESCE(ROUND(AVG(hb.std_hatch_pct),2)::text,'-')
         || ' std_avg=' || COALESCE(ROUND(AVG(s.hatchability_pct),2)::text,'-')
         || ' diff=' || COALESCE(ROUND(AVG(hb.std_hatch_pct - s.hatchability_pct),2)::text,'-') AS line
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY f.flock_no, f.laying_season
) x;
