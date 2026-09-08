-- Read-only. The rule is that the site the sale came FROM owns the income and is
-- answerable for the cash. That only works if every sale can name a site. Check
-- it by sale type - litter, gas, manure and the rest as well as eggs and birds -
-- because a sale with no flock has no site to attribute to at all.
SELECT 1 AS warmup;

-- 1. Every sale type: does it carry a flock, and does that flock have a site
SELECT s.sale_type,
       count(*)::int AS sales,
       round(sum(s.amount))::numeric AS amount,
       count(*) FILTER (WHERE s.flock_id IS NULL)::int AS no_flock,
       count(*) FILTER (WHERE s.flock_id IS NOT NULL
                          AND COALESCE(fl.laying_farm_id, fl.rearing_farm_id) IS NULL)::int AS flock_has_no_site,
       count(*) FILTER (WHERE s.shed_id IS NOT NULL)::int AS has_a_shed
FROM public.nhe_sales s
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
GROUP BY s.sale_type ORDER BY 3 DESC;

-- 2. The site each type's income actually lands on, by the shed-then-flock rule
SELECT COALESCE(fa.name,'(NO SITE - cannot be attributed)') AS site,
       s.sale_type, count(*)::int AS sales, round(sum(s.amount))::numeric AS amount
FROM public.nhe_sales s
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
LEFT JOIN public.farms fa
  ON fa.id = COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id)
GROUP BY 1,2 ORDER BY 4 DESC LIMIT 20;

-- 3. Anything that cannot be attributed at all, so the gap is a number not a fear
SELECT count(*)::int AS unattributable_sales,
       round(COALESCE(sum(s.amount),0))::numeric AS amount,
       COALESCE(string_agg(DISTINCT s.sale_type, ', '), '-') AS types,
       COALESCE(min(s.sale_date)::text,'-') || ' -> ' || COALESCE(max(s.sale_date)::text,'-') AS span
FROM public.nhe_sales s
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
WHERE COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id) IS NULL;

-- 4. And where their cash ended up, since a sale with no site still had money
SELECT COALESCE(fa.name,'(no site on the cash row)') AS cash_site,
       count(*)::int AS rows, round(sum(cb.amount_in))::numeric AS amount
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
WHERE COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id) IS NULL
GROUP BY 1 ORDER BY 2 DESC;
