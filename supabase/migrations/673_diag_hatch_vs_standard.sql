-- Diagnostic only, kept short so its output actually prints: is the STD Hatch %
-- typed on each batch the same as the Vencobb430 standard for that flock's age
-- and season?
WITH j AS (
  SELECT hb.std_hatch_pct AS typed, s.hatchability_pct AS std, f.flock_no, f.laying_season,
         ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  LEFT JOIN public.breed_standard s ON s.sex='Female' AND s.phase='Laying'
       AND s.season = f.laying_season
       AND s.week_of_age = ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
)
SELECT COUNT(*)::text AS batches,
       COUNT(typed)::text AS have_typed_std,
       COUNT(std)::text AS have_a_standard,
       COUNT(*) FILTER (WHERE typed IS NOT NULL AND std IS NOT NULL AND ABS(typed-std) < 0.05)::text AS match_exactly,
       COALESCE(ROUND(AVG(typed-std),2)::text,'-') AS avg_typed_minus_std,
       COALESCE(MIN(wk)::text,'-') || '-' || COALESCE(MAX(wk)::text,'-') AS age_weeks_span
FROM j;
