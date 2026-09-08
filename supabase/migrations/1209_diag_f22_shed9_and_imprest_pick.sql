-- Read-only. Two things asked about:
--   (a) Flock 22, Kethireddypally Shed 9 was emptied by 06/09/2026 yet still
--       offers itself in Bulk Daily Entry;
--   (b) an imprest chosen when a voucher was entered does not reappear on edit.
SELECT 1 AS warmup;

-- 1. Shed 9 at Kethireddypally for Flock 22: last records and closing birds
SELECT dr.record_date::text AS date,
       dr.opening_female, dr.opening_male, dr.closing_female, dr.closing_male,
       dr.mortality_female, dr.mortality_male, dr.cull_female, dr.cull_male,
       COALESCE(dr.trcull_female,0) AS trcull_f, COALESCE(dr.trcull_male,0) AS trcull_m
FROM public.daily_records dr
JOIN public.sheds sh ON sh.id = dr.shed_id
JOIN public.farms fa ON fa.id = sh.farm_id
JOIN public.flocks fl ON fl.id = dr.flock_id
WHERE fl.flock_no::text = '22' AND sh.shed_no = '9' AND fa.name ILIKE '%kethireddypally%'
ORDER BY dr.record_date DESC LIMIT 8;

-- 2. Why the shed is still offered: which of the three lists still names it
SELECT (SELECT count(*)::int FROM public.flock_sheds x JOIN public.sheds sh ON sh.id = x.shed_id
        JOIN public.farms fa ON fa.id = sh.farm_id JOIN public.flocks fl ON fl.id = x.flock_id
        WHERE fl.flock_no::text='22' AND sh.shed_no='9' AND fa.name ILIKE '%kethireddypally%') AS in_flock_sheds,
       (SELECT count(*)::int FROM public.shed_allocations x JOIN public.sheds sh ON sh.id = x.shed_id
        JOIN public.farms fa ON fa.id = sh.farm_id JOIN public.flocks fl ON fl.id = x.flock_id
        WHERE fl.flock_no::text='22' AND sh.shed_no='9' AND fa.name ILIKE '%kethireddypally%') AS in_shed_allocations,
       (SELECT count(*)::int FROM public.flock_transfers x JOIN public.sheds sh ON sh.id = x.to_shed_id
        JOIN public.farms fa ON fa.id = sh.farm_id JOIN public.flocks fl ON fl.id = x.flock_id
        WHERE fl.flock_no::text='22' AND sh.shed_no='9' AND fa.name ILIKE '%kethireddypally%') AS transferred_into;

-- 3. How many sheds would a zero-birds rule actually hide, across every flock -
--    so the idea is measured before it is built rather than after
SELECT count(*)::int AS flock_shed_pairs_with_records,
       count(*) FILTER (WHERE last_closing = 0)::int AS now_empty,
       count(*) FILTER (WHERE last_closing > 0)::int AS still_have_birds
FROM (
  SELECT dr.flock_id, dr.shed_id,
         (array_agg(COALESCE(dr.closing_female,0) + COALESCE(dr.closing_male,0)
                    ORDER BY dr.record_date DESC))[1] AS last_closing
  FROM public.daily_records dr WHERE dr.shed_id IS NOT NULL
  GROUP BY dr.flock_id, dr.shed_id
) t;

-- 4. The imprest picker: does any sale actually carry an explicit choice yet
SELECT count(*)::int AS cash_sales,
       count(*) FILTER (WHERE s.cash_account_id IS NOT NULL)::int AS imprest_stored_on_sale,
       (SELECT count(*)::int FROM public.cash_book cb
        WHERE cb.nhe_sale_id IS NOT NULL AND cb.cash_account_id IS NOT NULL) AS imprest_stored_on_cash_book,
       COALESCE(max(s.sale_date)::text,'-') AS latest_cash_sale
FROM public.nhe_sales s WHERE COALESCE(s.amount_received,0) > 0;
