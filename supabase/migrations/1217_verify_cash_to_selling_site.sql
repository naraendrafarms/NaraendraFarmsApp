-- Verification for 1216.
SELECT 1 AS warmup;

-- 1. Nothing should remain at a site other than the selling site
SELECT count(*)::int AS still_mismatched,
       round(COALESCE(sum(cb.amount_in),0))::numeric AS amount
FROM public.cash_book cb
LEFT JOIN public.nhe_sales s   ON s.id = cb.nhe_sale_id
LEFT JOIN public.sheds sh      ON sh.id = s.shed_id
LEFT JOIN public.flocks fls    ON fls.id = s.flock_id
LEFT JOIN public.he_dispatch d ON d.id = cb.he_dispatch_id
LEFT JOIN public.flocks fld    ON fld.id = d.flock_id
WHERE (cb.nhe_sale_id IS NOT NULL OR cb.he_dispatch_id IS NOT NULL)
  AND COALESCE(sh.farm_id, fls.laying_farm_id, fls.rearing_farm_id,
               fld.laying_farm_id, fld.rearing_farm_id) IS NOT NULL
  AND COALESCE(sh.farm_id, fls.laying_farm_id, fls.rearing_farm_id,
               fld.laying_farm_id, fld.rearing_farm_id) IS DISTINCT FROM cb.farm_id;

-- 2. What moved, and from where to where
SELECT COALESCE(oldf.name,'(no site)') AS moved_from,
       COALESCE(newf.name,'(no site)') AS moved_to,
       count(*)::int AS vouchers, round(sum(b.amount_in))::numeric AS amount
FROM public.cash_book_selling_site_1216 b
JOIN public.cash_book cb ON cb.id = b.id
LEFT JOIN public.farms oldf ON oldf.id = b.old_farm_id
LEFT JOIN public.farms newf ON newf.id = cb.farm_id
GROUP BY 1,2 ORDER BY 3 DESC;

-- 3. DC 7672 specifically, the one that was reported
SELECT s.dc_no, s.sale_type, round(cb.amount_in)::numeric AS amount,
       COALESCE(fa.name,'(no site)') AS cash_sits_at
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
WHERE s.dc_no = '7672';

-- 4. The imprest balances after the move
SELECT a.name, round(b.balance)::numeric AS balance, b.txn_count
FROM public.cash_accounts a
JOIN public.v_cash_account_balance b ON b.cash_account_id = a.id
WHERE a.acct_type IN ('ho_imprest','site_petty') AND a.is_active
ORDER BY a.sort_order;
