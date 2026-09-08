-- Read-only. The DC 0235 cull-bird sale on Flock 22, 06/09/2026, Rs 1,81,500:
-- the sales list shows Head Office while the Imprest Ledger shows Kethireddypally
-- Site Imprest. Find out which is the truth before anything is changed.

-- 1. The sale itself
SELECT s.id::text, s.sale_date::text, s.sale_type, s.dc_no, s.amount::numeric,
       s.payment_cash::numeric, s.amount_received::numeric, s.payment_status,
       COALESCE(p.name,'-') AS party, COALESCE(fl.flock_no::text,'-') AS flock,
       COALESCE(s.cash_account_id::text,'(none on the sale)') AS imprest_on_sale
FROM public.nhe_sales s
LEFT JOIN public.parties p ON p.id = s.party_id
LEFT JOIN public.flocks fl ON fl.id = s.flock_id
WHERE s.dc_no = '0235' AND s.sale_date = '2026-09-06';

-- 2. Its cash book row - where the location is really kept
SELECT cb.id::text, cb.txn_date::text, cb.amount_in::numeric,
       COALESCE(fa.name,'(no site - would read as Head Office)') AS site_on_cash_book,
       COALESCE(ca.name,'(none stored - derived)') AS imprest_on_cash_book
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
LEFT JOIN public.farms fa ON fa.id = cb.farm_id
LEFT JOIN public.cash_accounts ca ON ca.id = cb.cash_account_id
WHERE s.dc_no = '0235' AND s.sale_date = '2026-09-06';

-- 3. Which imprest the ledger actually counts it in
SELECT COALESCE(a.name,'(none)') AS imprest_in_ledger, v.derived AS imprest_was_derived,
       v.amount_in::numeric, v.farm_name
FROM public.v_imprest_entries v
JOIN public.nhe_sales s ON s.id = v.nhe_sale_id
LEFT JOIN public.cash_accounts a ON a.id = v.cash_account_id
WHERE s.dc_no = '0235' AND s.sale_date = '2026-09-06';

-- 4. What site Flock 22 itself points at, which is what a NEW sale would default to
SELECT fl.flock_no::text AS flock,
       COALESCE(l.name,'(no laying farm)') AS laying_farm,
       COALESCE(r.name,'(no rearing farm)') AS rearing_farm
FROM public.flocks fl
LEFT JOIN public.farms l ON l.id = fl.laying_farm_id
LEFT JOIN public.farms r ON r.id = fl.rearing_farm_id
WHERE fl.flock_no::text = '22';

-- 5. Is this sale one of the 17 that lost their site?
SELECT count(*)::int AS still_site_less_rows,
       COALESCE(sum(cb.amount_in),0)::numeric AS amount,
       count(*) FILTER (WHERE s.dc_no = '0235')::int AS includes_dc_0235
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
WHERE cb.farm_id IS NULL;
