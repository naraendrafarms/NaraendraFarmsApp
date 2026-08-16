-- Diagnostic only. Three things the Hatch Analysis page depends on, measured
-- before it is built rather than assumed:
--   (a) how many batches can produce an EGG AGE at all -- egg age needs a
--       linked dispatch, because the production date lives on the dispatch
--       lines, not on the batch;
--   (b) how many carry a CHICK RATE, which the money view needs;
--   (c) the week-wise and flock-age figures, which did not print in 661's log.

-- 1. Egg age and money coverage.
SELECT COUNT(*)::text AS batches,
       COUNT(dispatch_id)::text AS with_dispatch_link,
       COUNT(chick_rate)::text AS with_chick_rate,
       COUNT(chicks_sold)::text AS with_chicks_sold,
       COALESCE(MIN(chick_rate)::text,'-') AS min_rate,
       COALESCE(MAX(chick_rate)::text,'-') AS max_rate
FROM public.hatch_batches;

-- 2. Of the linked ones, can a production date actually be reached?
SELECT COUNT(DISTINCT b.id)::text AS linked_batches_with_prod_dates
FROM public.hatch_batches b
JOIN public.he_dispatch_lines l ON l.dispatch_id = b.dispatch_id
WHERE l.prod_date IS NOT NULL;

-- 3. Week-wise, worst eight setting weeks (statement 6 of 661, re-run).
SELECT string_agg(line, '  ||  ' ORDER BY hp) AS worst_weeks
FROM (
  SELECT ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) AS hp,
         to_char(date_trunc('week', b.setting_date),'DD/MM/YY')
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),1) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%'
           || ' unh=' || ROUND(SUM(b.unhatched)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%'
           || ' hcy=' || COUNT(DISTINCT COALESCE(b.hatchery_id::text, b.hatchery_name)) AS line
  FROM public.hatch_batches b
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY date_trunc('week', b.setting_date)
  ORDER BY 1 LIMIT 8
) w;

-- 4. Best eight weeks, for the contrast.
SELECT string_agg(line, '  ||  ' ORDER BY hp DESC) AS best_weeks
FROM (
  SELECT ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),2) AS hp,
         to_char(date_trunc('week', b.setting_date),'DD/MM/YY')
           || ': hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),1) || '%'
           || ' n=' || COUNT(*) AS line
  FROM public.hatch_batches b
  WHERE b.hatched_chicks IS NOT NULL
  GROUP BY date_trunc('week', b.setting_date)
  ORDER BY 1 DESC LIMIT 8
) w2;

-- 5. Flock age at setting against hatch % and infertility (statement 7 re-run),
--    in plain 5-week bands.
SELECT string_agg(line, '  ||  ' ORDER BY band) AS by_flock_age
FROM (
  SELECT (floor(EXTRACT(day FROM b.setting_date - f.placement_date)/35)*5)::int AS band,
         'wk' || (floor(EXTRACT(day FROM b.setting_date - f.placement_date)/35)*5)::int
           || '-' || ((floor(EXTRACT(day FROM b.setting_date - f.placement_date)/35)*5)::int + 4)
           || ': n=' || COUNT(*)
           || ' hatch=' || ROUND(SUM(b.hatched_chicks)::numeric*100/NULLIF(SUM(b.eggs_set),0),1) || '%'
           || ' inf=' || ROUND(SUM(b.infertile)::numeric*100/NULLIF(SUM(b.eggs_set-b.broken_transit),0),1) || '%' AS line
  FROM public.hatch_batches b JOIN public.flocks f ON f.id = b.flock_id
  WHERE b.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
  GROUP BY 1
) a;

-- 6. Is there a chick rate anywhere else in the app to default the money view
--    to? nhe_sales carries bird/egg rates by sale_type -- check what types
--    exist rather than assuming one of them is chicks.
SELECT COALESCE(string_agg(DISTINCT sale_type, ', '), 'NONE') AS nhe_sale_types
FROM public.nhe_sales;
