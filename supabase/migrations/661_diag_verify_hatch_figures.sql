-- Diagnostic only. Two jobs:
--   (a) recompute, in SQL, every figure the Hatch Batches page shows, so the
--       screen can be checked against the database rather than trusted;
--   (b) measure what a hatchery-wise / week-wise problem page would actually
--       reveal, before any of it is built.
--
-- Loss is split by WHERE it happens, because that is what decides whose problem
-- it is:
--   broken in transit -> handling and the lorry, between farm and hatchery
--   infertile         -> the BREEDER flock (males, age, mating) -- not the hatchery
--   blasters          -> egg hygiene and storage, farm or hatchery
--   unhatched         -> incubation itself, squarely the HATCHERY
-- A hatchery with a low hatch % because its eggs arrived infertile has a
-- breeder problem, not a hatchery problem, and the two must not be added up
-- into one number that blames the wrong party.

-- 1. The five tiles, recomputed. Compare against the screen.
SELECT COUNT(*)::text AS batches,
       SUM(eggs_set)::text AS total_eggs_set,
       SUM(std_chicks)::text AS std_chicks,
       SUM(hatched_chicks)::text AS chicks_hatched,
       ROUND(SUM(std_chicks)::numeric * 100 / NULLIF(SUM(eggs_set),0), 1)::text AS avg_std_pct,
       ROUND(SUM(hatched_chicks)::numeric * 100 / NULLIF(SUM(eggs_set),0), 1)::text AS avg_hatchability_pct
FROM public.hatch_batches WHERE hatched_chicks IS NOT NULL;

-- 2. Does every batch's parts add up? setting = infertile + blasters +
--    unhatched + hatched should hold on a complete report. Where it does not,
--    the hatchery's own sheet does not balance and no percentage from it is
--    fully trustworthy.
SELECT COUNT(*)::text AS batches_checked,
       COUNT(*) FILTER (WHERE (eggs_set - broken_transit)
             <> (COALESCE(infertile,0) + COALESCE(blasters,0) + COALESCE(unhatched,0) + COALESCE(hatched_chicks,0)))::text AS rows_that_do_not_balance,
       SUM(ABS((eggs_set - broken_transit)
             - (COALESCE(infertile,0) + COALESCE(blasters,0) + COALESCE(unhatched,0) + COALESCE(hatched_chicks,0))))::text AS total_unexplained_eggs
FROM public.hatch_batches WHERE hatched_chicks IS NOT NULL;

-- 3. HATCHERY-WISE, loss split by cause. This is the proposed page in one row
--    per hatchery: who is losing eggs, and to what.
SELECT string_agg(line, '  ||  ' ORDER BY hatch_pct) AS hatchery_wise
FROM (
  SELECT COALESCE(h.name, b.hatchery_name, '(not set)') AS nm,
         COUNT(*) AS batches,
         SUM(b.eggs_set) AS eggs,
         ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) AS hatch_pct,
         COALESCE(h.name, b.hatchery_name, '(not set)')
           || ': n=' || COUNT(*)
           || ' eggs=' || SUM(b.eggs_set)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' | brk=' || ROUND(SUM(b.broken_transit)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' blst=' || ROUND(SUM(b.blasters)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' vsSTD=' || ROUND((SUM(b.hatched_chicks)-SUM(b.std_chicks))::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || 'pp'
           AS line
  FROM public.hatch_batches b
  LEFT JOIN public.hatcheries h ON h.id = b.hatchery_id
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY COALESCE(h.name, b.hatchery_name, '(not set)'), h.name
) x;

-- 4. Is the difference between hatcheries real, or just which flocks/weeks they
--    happened to get? Same split, but by FLOCK -- if one flock is bad
--    everywhere, the flock is the problem, not the hatchery.
SELECT string_agg(line, '  ||  ' ORDER BY hatch_pct) AS flock_wise
FROM (
  SELECT f.flock_no,
         ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) AS hatch_pct,
         'F-' || f.flock_no || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' vsSTD=' || ROUND((SUM(b.hatched_chicks)-SUM(b.std_chicks))::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || 'pp'
           AS line
  FROM public.hatch_batches b JOIN public.flocks f ON f.id = b.flock_id
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY f.flock_no
) y;

-- 5. The same hatcheries, but restricted to ONE flock, so the comparison is
--    like-for-like. Uses whichever flock has the most hatcheries behind it.
SELECT string_agg(line, '  ||  ' ORDER BY line) AS like_for_like
FROM (
  SELECT 'F-' || f.flock_no || ' @ ' || COALESCE(h.name, b.hatchery_name,'(not set)')
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%' AS line
  FROM public.hatch_batches b
  JOIN public.flocks f ON f.id = b.flock_id
  LEFT JOIN public.hatcheries h ON h.id = b.hatchery_id
  WHERE b.hatched_chicks IS NOT NULL
    AND f.flock_no = (SELECT f2.flock_no FROM public.hatch_batches b2
                      JOIN public.flocks f2 ON f2.id = b2.flock_id
                      WHERE b2.hatched_chicks IS NOT NULL
                      GROUP BY f2.flock_no
                      ORDER BY COUNT(DISTINCT COALESCE(b2.hatchery_id::text, b2.hatchery_name)) DESC, COUNT(*) DESC LIMIT 1)
  GROUP BY f.flock_no, COALESCE(h.name, b.hatchery_name,'(not set)')
) z;

-- 6. WEEK-WISE: the worst eight setting-weeks by hatch %, with the cause split,
--    to show whether a bad week is a bad week everywhere or one hatchery.
SELECT string_agg(line, '  ||  ' ORDER BY hp) AS worst_weeks
FROM (
  SELECT ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) AS hp,
         to_char(date_trunc('week', b.setting_date),'DD/MM/YYYY')
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%'
           || ' hatcheries=' || COUNT(DISTINCT COALESCE(b.hatchery_id::text, b.hatchery_name)) AS line
  FROM public.hatch_batches b
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY date_trunc('week', b.setting_date)
  ORDER BY 1 LIMIT 8
) w;

-- 7. Flock AGE against hatch %, since fertility falls as a flock ages and that
--    is a breeder story, not a hatchery one.
SELECT string_agg(line, '  ||  ' ORDER BY band) AS by_flock_age
FROM (
  SELECT width_bucket(EXTRACT(day FROM b.setting_date - f.placement_date)/7, 20, 70, 5) AS band,
         'age band ' || width_bucket(EXTRACT(day FROM b.setting_date - f.placement_date)/7, 20, 70, 5)
           || ': n=' || COUNT(*)
           || ' wks=' || ROUND(MIN(EXTRACT(day FROM b.setting_date - f.placement_date)/7))
           || '-' || ROUND(MAX(EXTRACT(day FROM b.setting_date - f.placement_date)/7))
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),2) || '%' AS line
  FROM public.hatch_batches b JOIN public.flocks f ON f.id = b.flock_id
  WHERE b.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY 1
) a;
