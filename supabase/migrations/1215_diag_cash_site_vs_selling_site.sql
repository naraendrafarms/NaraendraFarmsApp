-- Read-only. A Flock 20 bird sale (20/08/2026, DC 7672, Rs 312) sits in the
-- KETHIREDDYPALLY imprest, but Flock 20 sells from Bodjanampet-1. Under the
-- owner's rule the site the sale came FROM holds the cash, so this is a
-- mismatch. Measure how many there are and where, before proposing anything.
SELECT 1 AS warmup;

-- 1. The named voucher
SELECT s.dc_no, s.sale_date::text, s.sale_type, round(s.amount)::numeric AS amount,
       COALESCE(fl.flock_no::text,'-') AS flock,
       COALESCE(sell.name,'(none)') AS selling_site,
       COALESCE(cash.name,'(no site - Head Office)') AS cash_sits_at,
       COALESCE(sh.shed_no,'(no shed)') AS shed
FROM public.nhe_sales s
JOIN public.cash_book cb ON cb.nhe_sale_id = s.id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
LEFT JOIN public.farms sell ON sell.id = COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id)
LEFT JOIN public.farms cash ON cash.id = cb.farm_id
WHERE s.dc_no = '7672';

-- 2. Every cash receipt whose site is NOT the selling site
SELECT COALESCE(sell.name,'(none)') AS selling_site,
       COALESCE(cash.name,'(no site - Head Office)') AS cash_sits_at,
       count(*)::int AS vouchers, round(sum(cb.amount_in))::numeric AS amount
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
LEFT JOIN public.farms sell ON sell.id = COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id)
LEFT JOIN public.farms cash ON cash.id = cb.farm_id
WHERE COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id) IS DISTINCT FROM cb.farm_id
GROUP BY 1,2 ORDER BY 3 DESC;

-- 3. The total size of it
SELECT count(*)::int AS mismatched_vouchers,
       round(sum(cb.amount_in))::numeric AS amount,
       COALESCE(min(cb.txn_date)::text,'-') || ' -> ' || COALESCE(max(cb.txn_date)::text,'-') AS span,
       COALESCE(string_agg(DISTINCT s.sale_type, ', '), '-') AS types
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
LEFT JOIN public.sheds sh ON sh.id = s.shed_id
WHERE COALESCE(sh.farm_id, fl.laying_farm_id, fl.rearing_farm_id) IS DISTINCT FROM cb.farm_id;

-- 4. Same question for hatching-egg dispatches, so the answer is not half of it
SELECT count(*)::int AS he_mismatched,
       round(COALESCE(sum(cb.amount_in),0))::numeric AS amount
FROM public.cash_book cb
JOIN public.he_dispatch d ON d.id = cb.he_dispatch_id
LEFT JOIN public.flocks fl ON fl.id = d.flock_id
WHERE COALESCE(fl.laying_farm_id, fl.rearing_farm_id) IS DISTINCT FROM cb.farm_id;
