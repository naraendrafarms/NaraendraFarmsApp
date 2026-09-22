-- READ ONLY. No INSERT, UPDATE, DELETE or DDL. Analysis only.
-- What the cost-per-egg is actually built from, per flock, so the gap the
-- Cost & Income tab warns about can be sized properly.

SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS feed_and_eggs
FROM (
  SELECT f.flock_no,
         'F' || f.flock_no
           || ' feedKg=' || ROUND(COALESCE(SUM(d.feed_female_kg),0) + COALESCE(SUM(d.feed_male_kg),0))
           || ' noTypeF=' || ROUND(COALESCE(SUM(d.feed_female_kg) FILTER (WHERE d.feed_type_f IS NULL), 0))
           || ' noTypeM=' || ROUND(COALESCE(SUM(d.feed_male_kg) FILTER (WHERE d.feed_type_m IS NULL), 0))
           || ' eggs=' || COALESCE(SUM(d.total_eggs), 0)
           || ' he=' || COALESCE(SUM(d.he_eggs), 0)
           || ' days=' || COUNT(DISTINCT d.record_date)
           AS line
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   GROUP BY f.flock_no
) s;

SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS flock_basics
FROM (
  SELECT f.flock_no,
         'F' || f.flock_no || ' ' || f.status
           || ' placedF=' || COALESCE(f.total_placed_f, 0)
           || ' placedM=' || COALESCE(f.total_placed_m, 0)
           || ' chickCost=' || COALESCE(ROUND(f.chick_cost)::text, 'null')
           || ' wk=' || (((CURRENT_DATE - f.placement_date) / 7))
           AS line
    FROM public.flocks f
) s;

-- Which feed types carry the kg, so the unpriced ones can be named.
SELECT string_agg(line, ' | ' ORDER BY kg DESC) AS feed_by_type
FROM (
  SELECT COALESCE(ft.code, '(no type)') AS code,
         ROUND(SUM(COALESCE(d.feed_female_kg,0))) AS kg,
         COALESCE(ft.code, '(no type)') || '=' || ROUND(SUM(COALESCE(d.feed_female_kg,0))) AS line
    FROM public.daily_records d
    LEFT JOIN public.feed_types ft ON ft.id = d.feed_type_f
   GROUP BY ft.code
) s;
