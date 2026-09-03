-- Migration 1156: read-only. Which sites the NHE sales actually belong to, and
-- how each site's sales were settled.
--
-- The owner's point: before tagging cash receipts to a site imprest, look at
-- what is really there -- which sites have sales, how many were cash, and how
-- many were deducted from salary. Tagging is only sensible once the shape of
-- the data is known.
--
-- 1155 gave nhe_sales its own farm_id and backfilled all 540 from the flock's
-- laying farm, and created one imprest per site. This measures the join
-- between the two.
--
-- Nothing is written.

-- [1] Per site: sales, value, and the cash / salary-deduction split.
-- deduction_vouchers counts sales that have an employee_deductions row, which
-- is the real record of a salary settlement -- not a flag on the sale.
SELECT COALESCE(string_agg(t.txt, ' || ' ORDER BY t.nm), 'NO SALES') AS by_site
FROM (
  SELECT f.name AS nm,
         f.name || ': ' || count(*) || ' sales, Rs ' || round(sum(s.amount))
           || ' | cash ' || count(*) FILTER (WHERE COALESCE(s.payment_cash,0) > 0)
           || ' | salary ' || count(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM public.employee_deductions d WHERE d.nhe_sale_id = s.id))
           || ' | emp-sale ' || count(*) FILTER (WHERE s.is_employee_sale) AS txt
  FROM public.nhe_sales s
  JOIN public.farms f ON f.id = s.farm_id
  GROUP BY f.name
) t;

-- [2] Does every site with sales have an imprest account to tag them to?
SELECT COALESCE(string_agg(f.name, ', ' ORDER BY f.name), 'ALL COVERED') AS sites_with_sales_but_no_imprest
FROM public.farms f
WHERE EXISTS (SELECT 1 FROM public.nhe_sales s WHERE s.farm_id = f.id)
  AND NOT EXISTS (SELECT 1 FROM public.cash_accounts a WHERE a.farm_id = f.id AND a.is_active);

-- [3] The cash_book receipts these sales already created, and how many are
-- untagged. These are what a cutover would decide the fate of.
SELECT count(*)::int AS sale_receipts_in_cash_book,
       count(*) FILTER (WHERE cb.cash_account_id IS NULL)::int AS untagged,
       count(*) FILTER (WHERE cb.cash_account_id IS NOT NULL)::int AS already_tagged,
       min(cb.txn_date) AS earliest,
       max(cb.txn_date) AS latest,
       round(sum(COALESCE(cb.amount_in,0)))::numeric AS total_received
FROM public.cash_book cb
WHERE cb.nhe_sale_id IS NOT NULL;

-- [4] Sales whose settlement is unclear -- neither cash recorded nor a salary
-- deduction. These cannot be tagged to anything until someone says how they
-- were settled, so their number matters before promising a clean tagging.
SELECT count(*)::int AS total_sales,
       count(*) FILTER (WHERE COALESCE(s.payment_cash,0) > 0)::int AS has_cash,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.employee_deductions d
                                      WHERE d.nhe_sale_id = s.id))::int AS has_salary_deduction,
       count(*) FILTER (WHERE COALESCE(s.payment_cash,0) = 0
                          AND NOT EXISTS (SELECT 1 FROM public.employee_deductions d
                                          WHERE d.nhe_sale_id = s.id))::int AS neither,
       count(*) FILTER (WHERE s.payment_status = 'Pending')::int AS still_pending
FROM public.nhe_sales s;

-- [5] The imprest accounts now available to tag to, for reference.
SELECT string_agg(name || ' [' || acct_type || ']', ' | ' ORDER BY sort_order, name) AS imprest_accounts
FROM public.cash_accounts WHERE is_active;
