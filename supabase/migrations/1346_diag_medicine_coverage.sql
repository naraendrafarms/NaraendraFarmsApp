-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Nothing is written.
-- Medicine was left unscaled while salary, electricity and expenses were
-- scaled to the flock's full 17 months. Is medicine_usage complete, or does it
-- cover only some months too?
SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS med_coverage
FROM (
  SELECT f.flock_no,
         'F' || f.flock_no
           || ' medMonths=' || COUNT(DISTINCT to_char(m.usage_date, 'YYYY-MM'))
           || ' rows=' || COUNT(*)
           || ' first=' || COALESCE(to_char(MIN(m.usage_date), 'YYYY-MM'), '-')
           || ' last=' || COALESCE(to_char(MAX(m.usage_date), 'YYYY-MM'), '-')
           AS line
    FROM public.flocks f
    JOIN public.medicine_usage m ON m.flock_id = f.id
   GROUP BY f.flock_no
) s;

-- How many usage rows carry no price at all (no rate, and no stock rate to
-- fall back on) - those are silently worth zero in every cost figure.
SELECT 'medicine_usage rows=' || COUNT(*)
    || ' withRate=' || COUNT(*) FILTER (WHERE COALESCE(rate, 0) > 0)
    || ' withAmount=' || COUNT(*) FILTER (WHERE COALESCE(amount, 0) > 0)
    || ' noRateNoAmount=' || COUNT(*) FILTER (WHERE COALESCE(rate, 0) = 0 AND COALESCE(amount, 0) = 0)
    || ' months=' || COUNT(DISTINCT to_char(usage_date, 'YYYY-MM'))
    || ' first=' || COALESCE(to_char(MIN(usage_date), 'YYYY-MM'), '-')
    || ' last=' || COALESCE(to_char(MAX(usage_date), 'YYYY-MM'), '-')
    AS med_pricing
  FROM public.medicine_usage;
