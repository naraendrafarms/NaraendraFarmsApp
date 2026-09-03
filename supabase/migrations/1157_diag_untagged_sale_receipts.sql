-- Migration 1157: read-only. The 138 untagged cash receipts that came from NHE
-- sales, broken down so the owner can decide how far back to tag.
--
-- The full 138 rows will not fit in a job log without being truncated, and a
-- truncated list is worse than none. Broken down by site and month instead,
-- which is what actually decides a cutover date. One statement per site so no
-- single line runs long enough to be cut.
--
-- Nothing is written.

-- [1] Agraharam Potlapally, by month.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.mth), 'NONE') AS agraharam_by_month
FROM (
  SELECT to_char(cb.txn_date, 'YYYY-MM') AS mth,
         to_char(cb.txn_date, 'Mon YY') || ': ' || count(*) || ' rcpt Rs ' || round(sum(cb.amount_in)) AS txt
  FROM public.cash_book cb
  JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
  JOIN public.farms f ON f.id = s.farm_id
  WHERE cb.cash_account_id IS NULL AND f.name = 'Agraharam Potlapally'
  GROUP BY 1, to_char(cb.txn_date, 'Mon YY')
) t;

-- [2] Bodjanampet - 1, by month.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.mth), 'NONE') AS bpet1_by_month
FROM (
  SELECT to_char(cb.txn_date, 'YYYY-MM') AS mth,
         to_char(cb.txn_date, 'Mon YY') || ': ' || count(*) || ' rcpt Rs ' || round(sum(cb.amount_in)) AS txt
  FROM public.cash_book cb
  JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
  JOIN public.farms f ON f.id = s.farm_id
  WHERE cb.cash_account_id IS NULL AND f.name = 'Bodjanampet - 1'
  GROUP BY 1, to_char(cb.txn_date, 'Mon YY')
) t;

-- [3] Every other site, by site and month.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.nm, t.mth), 'NONE') AS other_sites
FROM (
  SELECT f.name AS nm, to_char(cb.txn_date, 'YYYY-MM') AS mth,
         f.name || ' ' || to_char(cb.txn_date, 'Mon YY') || ': ' || count(*)
           || ' rcpt Rs ' || round(sum(cb.amount_in)) AS txt
  FROM public.cash_book cb
  JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
  LEFT JOIN public.farms f ON f.id = s.farm_id
  WHERE cb.cash_account_id IS NULL
    AND COALESCE(f.name, '?') NOT IN ('Agraharam Potlapally', 'Bodjanampet - 1')
  GROUP BY f.name, 1, to_char(cb.txn_date, 'Mon YY')
) t;

-- [4] Totals per site, and what each sale type contributed -- so the shape of
-- the money is clear, not just the count.
SELECT string_agg(t.txt, ' || ' ORDER BY t.nm) AS totals_by_site
FROM (
  SELECT COALESCE(f.name, 'NO SITE') AS nm,
         COALESCE(f.name, 'NO SITE') || ': ' || count(*) || ' receipts, Rs '
           || round(sum(cb.amount_in)) || ', ' || min(cb.txn_date) || ' to ' || max(cb.txn_date) AS txt
  FROM public.cash_book cb
  JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
  LEFT JOIN public.farms f ON f.id = s.farm_id
  WHERE cb.cash_account_id IS NULL
  GROUP BY f.name
) t;

-- [5] The biggest single receipts, so nothing large is tagged unnoticed.
SELECT string_agg(t.txt, ' | ' ORDER BY t.amt DESC) AS top_10_receipts
FROM (
  SELECT cb.amount_in AS amt,
         cb.txn_date || ' ' || COALESCE(f.name, '?') || ' ' || s.sale_type
           || ' Rs ' || round(cb.amount_in) AS txt
  FROM public.cash_book cb
  JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
  LEFT JOIN public.farms f ON f.id = s.farm_id
  WHERE cb.cash_account_id IS NULL
  ORDER BY cb.amount_in DESC
  LIMIT 10
) t;
