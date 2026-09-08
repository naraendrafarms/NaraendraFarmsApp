-- Read-only. Why NHE Sales shows "Head Office" in Cash Received At (Location).
-- In the form a blank location and Head Office are the SAME value: EMPTY_NHE_FORM
-- sets cash_farm_id 'ho', save maps 'ho' to NULL, and edit maps NULL back to 'ho'.
-- So a sale that never recorded a location is indistinguishable from one genuinely
-- received at Head Office. Measure how many rows that is before proposing anything.

-- 1. Cash sales by whether a location was ever recorded
SELECT count(*)::int AS cash_sales,
       count(*) FILTER (WHERE cash_farm_id IS NULL)::int AS location_blank,
       count(*) FILTER (WHERE cash_farm_id IS NOT NULL)::int AS location_set,
       COALESCE(min(sale_date)::text,'-') || ' -> ' || COALESCE(max(sale_date)::text,'-') AS span,
       COALESCE(sum(amount_received),0)::numeric AS cash_value
FROM public.nhe_sales
WHERE COALESCE(amount_received,0) > 0;

-- 2. Of the blank ones, what site would the flock itself point at
SELECT COALESCE(f.name,'(flock has no site either)') AS flock_site,
       count(*)::int AS blank_location_sales,
       COALESCE(sum(s.amount_received),0)::numeric AS cash_value
FROM public.nhe_sales s
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.farms f ON f.id = COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
WHERE COALESCE(s.amount_received,0) > 0 AND s.cash_farm_id IS NULL
GROUP BY f.name ORDER BY 2 DESC;

-- 3. Where those blank-location sales landed in the cash book, and in which imprest
SELECT COALESCE(fa.name,'(no site on cash book row)') AS cash_book_site,
       COALESCE(ca.name,'(no imprest)') AS imprest,
       count(*)::int AS rows,
       COALESCE(sum(cb.amount),0)::numeric AS amount
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
LEFT JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
WHERE s.cash_farm_id IS NULL
GROUP BY fa.name, ca.name ORDER BY 3 DESC;

-- 4. The same for sales that DO carry a location, as the contrast
SELECT COALESCE(fa.name,'(none)') AS sale_location, count(*)::int AS rows,
       COALESCE(sum(s.amount_received),0)::numeric AS cash_value
FROM public.nhe_sales s
LEFT JOIN public.farms fa ON fa.id = s.cash_farm_id
WHERE COALESCE(s.amount_received,0) > 0 AND s.cash_farm_id IS NOT NULL
GROUP BY fa.name ORDER BY 2 DESC;

-- 5. How many carry an explicit imprest pick versus relying on the derivation
SELECT count(*)::int AS cash_sales,
       count(*) FILTER (WHERE cash_account_id IS NOT NULL)::int AS imprest_picked,
       count(*) FILTER (WHERE cash_account_id IS NULL)::int AS imprest_derived
FROM public.nhe_sales WHERE COALESCE(amount_received,0) > 0;
