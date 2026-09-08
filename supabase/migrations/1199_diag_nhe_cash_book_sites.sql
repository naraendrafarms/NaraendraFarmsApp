-- Read-only. 1198's last statement named cb.amount, which cash_book does not have
-- (it is amount_in / amount_out), so it failed silently. Re-run with the real
-- columns: where NHE sale cash actually sits, by site and imprest.

-- 1. NHE sale cash by the site on its cash book row
SELECT COALESCE(fa.name,'(no site - reads as Head Office)') AS cash_book_site,
       count(*)::int AS rows,
       COALESCE(sum(cb.amount_in),0)::numeric AS cash_in
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
GROUP BY fa.name ORDER BY 2 DESC;

-- 2. Of the ones with no site, what site the flock itself points at - i.e. how many
--    are probably a site sale that lost its location, rather than a real HO receipt
SELECT COALESCE(f.name,'(flock has no site either)') AS flock_site,
       count(*)::int AS rows,
       COALESCE(sum(cb.amount_in),0)::numeric AS cash_in
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.farms f ON f.id = COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
WHERE cb.farm_id IS NULL
GROUP BY f.name ORDER BY 2 DESC;

-- 3. Which imprest those no-site rows are counting in today
SELECT COALESCE(ca.name,'(no imprest on the row)') AS imprest_on_row,
       count(*)::int AS rows, COALESCE(sum(cb.amount_in),0)::numeric AS cash_in
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
WHERE cb.farm_id IS NULL
GROUP BY ca.name ORDER BY 2 DESC;

-- 4. Same question through the imprest view, which is what the Imprest Ledger reads
SELECT count(*)::int AS nhe_rows_in_imprest_view
FROM public.v_imprest_entries v
WHERE v.nhe_sale_id IS NOT NULL;
