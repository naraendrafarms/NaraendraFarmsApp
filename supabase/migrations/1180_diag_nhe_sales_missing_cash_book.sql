-- Migration 1180: read-only. The 345 nhe_sales with no cash_book row -- how
-- many are legitimately cashless, and how many are a real posting gap.
--
-- WHY THE TASK COULD NOT ANSWER THIS: it says the schema has no payment-status
-- column. That is out of date -- nhe_sales.payment_status exists
-- (Pending / Partial / Received), as do payment_cash, payment_online,
-- advance_adjusted and is_employee_sale.
--
-- A cash_book row is written ONLY when cash is received. So there are four
-- legitimate reasons a sale has none:
--   1. still unpaid            -> nothing to post yet (a credit sale)
--   2. paid online / by bank   -> posts to bank_transactions instead
--   3. recovered from salary   -> posts to employee_deductions instead
--   4. settled against advance -> the money is already in party_advances
-- A sale with CASH received and no cash_book row is the only real gap.
--
-- Nothing is written.

-- [1] The shape of the whole set.
SELECT count(*)::int AS all_sales,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id))::int AS with_cb,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id))::int AS no_cb,
       round(COALESCE(sum(s.amount) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id)),0))::numeric AS no_cb_value
FROM public.nhe_sales s;

-- [2] Those without a cash_book row, by payment status.
SELECT COALESCE(s.payment_status,'(none)') AS status, count(*)::int AS rows,
       round(sum(s.amount))::numeric AS billed,
       round(sum(COALESCE(s.amount_received,0)))::numeric AS received,
       round(sum(COALESCE(s.payment_cash,0)))::numeric AS cash_part
FROM public.nhe_sales s
WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id)
GROUP BY s.payment_status ORDER BY 2 DESC;

-- [3] The same set, tested against the four legitimate reasons. A row can
-- match more than one, so these are not mutually exclusive by construction --
-- the residue in [4] is what matches NONE of them.
SELECT count(*)::int AS no_cb,
       count(*) FILTER (WHERE COALESCE(s.amount_received,0) <= 0.005)::int AS unpaid,
       count(*) FILTER (WHERE COALESCE(s.payment_online,0) > 0
                          OR EXISTS (SELECT 1 FROM public.bank_transactions bt WHERE bt.nhe_sale_id = s.id))::int AS via_bank,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.employee_deductions d WHERE d.nhe_sale_id = s.id))::int AS via_salary,
       count(*) FILTER (WHERE COALESCE(s.advance_adjusted,0) > 0 OR s.party_advance_id IS NOT NULL)::int AS via_advance,
       count(*) FILTER (WHERE COALESCE(s.payment_cash,0) > 0)::int AS claims_cash
FROM public.nhe_sales s
WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id);

-- [4] THE RESIDUE: cash was received, and none of the other routes explains it.
-- This is the only genuinely missing posting.
SELECT count(*)::int AS real_gap_rows,
       round(COALESCE(sum(s.payment_cash),0))::numeric AS cash_not_posted,
       min(s.sale_date)::text || ' to ' || max(s.sale_date)::text AS span
FROM public.nhe_sales s
WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id)
  AND COALESCE(s.payment_cash,0) > 0
  AND NOT EXISTS (SELECT 1 FROM public.employee_deductions d WHERE d.nhe_sale_id = s.id)
  AND COALESCE(s.advance_adjusted,0) <= 0 AND s.party_advance_id IS NULL;

-- [5] That residue by month, so it is clear whether it is historical import or
-- still happening on live entry.
SELECT string_agg(t.txt, ' | ' ORDER BY t.m) AS gap_by_month
FROM (
  SELECT to_char(s.sale_date,'YYYY-MM') AS m,
         to_char(s.sale_date,'YYYY-MM') || ': ' || count(*) || ' rows Rs ' || round(sum(COALESCE(s.payment_cash,0))) AS txt
  FROM public.nhe_sales s
  WHERE NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.nhe_sale_id = s.id)
    AND COALESCE(s.payment_cash,0) > 0
    AND NOT EXISTS (SELECT 1 FROM public.employee_deductions d WHERE d.nhe_sale_id = s.id)
    AND COALESCE(s.advance_adjusted,0) <= 0 AND s.party_advance_id IS NULL
  GROUP BY to_char(s.sale_date,'YYYY-MM')
) t;
