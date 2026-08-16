-- Diagnostic only, for the flock-age-band and season filters.
--
-- "Season" could mean two different things and they are not interchangeable:
--   (a) flocks.laying_season -- Summer/Winter, a property of the FLOCK, set by
--       hand on the flock master and used to pick the Venco standard curve;
--   (b) the season the eggs were SET in, derived from the setting month.
-- If every flock carries the same laying_season, filtering on (a) is just the
-- flock filter wearing a different hat, and only (b) would tell you anything.
-- Checked rather than assumed.

-- 1. What laying_season do the flocks with hatch batches actually carry?
SELECT COALESCE(string_agg(line, ', ' ORDER BY line), 'NONE') AS flock_seasons
FROM (
  SELECT DISTINCT 'F-' || f.flock_no || '=' || COALESCE(f.laying_season, '(not set)') AS line
  FROM public.flocks f
  WHERE EXISTS (SELECT 1 FROM public.hatch_batches b WHERE b.flock_id = f.id)
) x;

-- 2. Hatch % by SETTING MONTH, so a month-based season split can be drawn on
--    evidence rather than on an assumed summer.
SELECT string_agg(line, ' | ' ORDER BY mth) AS by_setting_month
FROM (
  SELECT to_char(date_trunc('month', b.setting_date), 'YYYY-MM') AS mth,
         to_char(date_trunc('month', b.setting_date), 'Mon YY')
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),1) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%'
           AS line
  FROM public.hatch_batches b
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY date_trunc('month', b.setting_date)
) y;

-- 3. Flock age at setting, in the 10-week bands the filter would offer, with
--    the batch counts that decide whether those bands are the right cuts.
SELECT string_agg(line, ' | ' ORDER BY lo) AS by_age_band
FROM (
  SELECT (floor(EXTRACT(day FROM b.setting_date - f.placement_date)/70)*10)::int AS lo,
         'wk' || (floor(EXTRACT(day FROM b.setting_date - f.placement_date)/70)*10)::int
           || '-' || ((floor(EXTRACT(day FROM b.setting_date - f.placement_date)/70)*10)::int + 9)
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),1) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%'
           AS line
  FROM public.hatch_batches b
  JOIN public.flocks f ON f.id = b.flock_id
  WHERE b.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY 1
) z;

-- 4. The full age span present, so the filter's bands cover the real range and
--    no batch falls outside every band.
SELECT MIN(wk)::text AS min_age_weeks, MAX(wk)::text AS max_age_weeks,
       COUNT(*)::text AS batches_with_age,
       (SELECT COUNT(*) FROM public.hatch_batches b2 JOIN public.flocks f2 ON f2.id=b2.flock_id
        WHERE b2.hatched_chicks IS NOT NULL AND f2.placement_date IS NULL)::text AS batches_without_placement_date
FROM (
  SELECT ROUND(EXTRACT(day FROM b.setting_date - f.placement_date)/7) AS wk
  FROM public.hatch_batches b JOIN public.flocks f ON f.id = b.flock_id
  WHERE b.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
) w;
