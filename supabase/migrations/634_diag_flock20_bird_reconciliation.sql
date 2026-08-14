-- Diagnostic only (no schema changes, no data changes). Flock 20 in detail.
--
-- 633 showed no row on any flock fails
--   closing = opening + received − mortality − cull − transfer out
-- but that only proves each row is internally consistent. It does NOT prove the
-- deductions are COMPLETE. Two things it cannot see:
--
--   a) the lifetime reconciliation — placed + received − mortality − cull −
--      transfers out should equal the birds standing today;
--   b) whether birds SOLD (recorded in NHE Sales as bird sales) were also taken
--      out of the daily records. A bird sale entered on the sales side but
--      never deducted from the flock leaves the bird count overstated while
--      every individual row still balances perfectly.
--
-- (b) is the one worth checking, and nothing in the app cross-checks it.

-- 1. Lifetime reconciliation, females and males, from the daily records alone.
SELECT (SELECT total_placed_f FROM public.flocks WHERE flock_no = '20') AS placed_f,
       (SELECT total_placed_m FROM public.flocks WHERE flock_no = '20') AS placed_m,
       COALESCE(SUM(d.transfer_in_female), 0) AS received_f,
       COALESCE(SUM(d.transfer_in_male), 0)   AS received_m,
       COALESCE(SUM(d.mortality_female), 0)   AS mortality_f,
       COALESCE(SUM(d.mortality_male), 0)     AS mortality_m
FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20';

-- 2. The outward side: culls and transfers/sales out.
SELECT COALESCE(SUM(d.cull_female), 0) AS cull_f,
       COALESCE(SUM(d.cull_male), 0) AS cull_m,
       COALESCE(SUM(d.transfer_female), 0) AS out_f,
       COALESCE(SUM(d.transfer_male), 0) AS out_m,
       (SELECT COALESCE(current_female,0) FROM public.v_flock_summary WHERE flock_no = '20') AS current_f,
       (SELECT COALESCE(current_male,0) FROM public.v_flock_summary WHERE flock_no = '20') AS current_m
FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20';

-- 3. Does it all tie out? placed + received − mortality − cull − out vs the
--    birds standing today. Any non-zero difference is birds unaccounted for.
SELECT (SELECT total_placed_f FROM public.flocks WHERE flock_no='20')
         + COALESCE(SUM(d.transfer_in_female),0) - COALESCE(SUM(d.mortality_female),0)
         - COALESCE(SUM(d.cull_female),0) - COALESCE(SUM(d.transfer_female),0)
         - (SELECT COALESCE(current_female,0) FROM public.v_flock_summary WHERE flock_no='20') AS female_unaccounted,
       (SELECT total_placed_m FROM public.flocks WHERE flock_no='20')
         + COALESCE(SUM(d.transfer_in_male),0) - COALESCE(SUM(d.mortality_male),0)
         - COALESCE(SUM(d.cull_male),0) - COALESCE(SUM(d.transfer_male),0)
         - (SELECT COALESCE(current_male,0) FROM public.v_flock_summary WHERE flock_no='20') AS male_unaccounted
FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20';

-- 4. THE CROSS-CHECK: birds sold on the sales side against birds taken out on
--    the daily side. These are recorded in two different places by two
--    different people, and nothing has ever compared them.
SELECT COALESCE(SUM(s.female_qty), 0) AS sold_female_qty,
       COALESCE(SUM(s.male_qty), 0)   AS sold_male_qty,
       COUNT(*) AS bird_sale_records,
       COALESCE(string_agg(s.sale_date::text || ' ♀' || COALESCE(s.female_qty,0)
                || ' ♂' || COALESCE(s.male_qty,0), ' | ' ORDER BY s.sale_date), 'NO BIRD SALES') AS sales_detail
FROM public.nhe_sales s JOIN public.flocks f ON f.id = s.flock_id
WHERE f.flock_no = '20' AND s.sale_type = 'bird_sale';

-- 5. Culls and sales-out by date on the daily side, so they can be lined up
--    against statement 4 by eye.
SELECT COALESCE(string_agg(d.record_date::text || ' cull ♀' || COALESCE(d.cull_female,0)
         || ' ♂' || COALESCE(d.cull_male,0) || ' / out ♀' || COALESCE(d.transfer_female,0)
         || ' ♂' || COALESCE(d.transfer_male,0), ' | ' ORDER BY d.record_date), 'NONE') AS daily_removals
FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '20'
  AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0
       OR COALESCE(d.transfer_female,0) > 0 OR COALESCE(d.transfer_male,0) > 0);
