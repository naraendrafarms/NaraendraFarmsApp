-- READ ONLY. Can a bank balance, an imprest balance and a receivables total be
-- rebuilt AS AT A CHOSEN DATE, rather than only as of now?
--
-- Bank and imprest clearly can: bank_transactions and cash_book both carry a
-- date on every row, so a running balance up to any date is just a sum with an
-- upper bound.
--
-- Receivables are the doubtful one. Migration 076 did NOT create a receipts
-- table - it put the receipt on the SALE itself: payment_status,
-- amount_received, received_date. One date per sale. So a sale paid in full has
-- a date that can be tested against any day, but a PARTIAL sale carries a
-- CUMULATIVE amount_received against a SINGLE received_date - if money came in
-- twice on different days, how much had arrived by an earlier date cannot be
-- recovered. Counting how many Partials there are decides whether an as-at-date
-- receivable figure is honest or a guess.

SELECT 'nhe_sales' AS source,
       count(*)::int                                                   AS rows_total,
       count(*) FILTER (WHERE payment_status = 'Partial')::int          AS partial,
       count(*) FILTER (WHERE payment_status = 'Received')::int         AS received,
       count(*) FILTER (WHERE payment_status = 'Pending' OR payment_status IS NULL)::int AS pending,
       count(*) FILTER (WHERE payment_status = 'Received' AND received_date IS NULL)::int AS received_but_no_date,
       round(COALESCE(sum(COALESCE(amount,0) - COALESCE(tds_amount,0) - COALESCE(amount_received,0))
             FILTER (WHERE payment_status = 'Partial'),0))::int         AS partial_amount_still_owed
FROM public.nhe_sales
UNION ALL
SELECT 'he_dispatch',
       count(*)::int,
       count(*) FILTER (WHERE payment_status = 'Partial')::int,
       count(*) FILTER (WHERE payment_status = 'Received')::int,
       count(*) FILTER (WHERE payment_status = 'Pending' OR payment_status IS NULL)::int,
       count(*) FILTER (WHERE payment_status = 'Received' AND received_date IS NULL)::int,
       round(COALESCE(sum(COALESCE(amount,0) - COALESCE(tds_amount,0) - COALESCE(amount_received,0))
             FILTER (WHERE payment_status = 'Partial'),0))::int
FROM public.he_dispatch;

-- Bank: is every transaction dated, and how far back does it go?
SELECT count(*)::int AS bank_txns,
       count(*) FILTER (WHERE txn_date IS NULL)::int AS undated,
       min(txn_date)::text AS earliest, max(txn_date)::text AS latest,
       (SELECT count(*)::int FROM public.bank_accounts WHERE is_active AND bank_name ILIKE '%kotak%') AS kotak_accounts,
       (SELECT count(*)::int FROM public.bank_fy_opening) AS fy_opening_rows
FROM public.bank_transactions;

-- Imprest: same question for the cash book.
SELECT count(*)::int AS cash_book_rows,
       count(*) FILTER (WHERE txn_date IS NULL)::int AS undated,
       count(*) FILTER (WHERE cash_account_id IS NOT NULL)::int AS assigned_to_an_imprest,
       min(txn_date)::text AS earliest, max(txn_date)::text AS latest,
       (SELECT count(*)::int FROM public.cash_accounts WHERE is_active) AS active_cash_accounts
FROM public.cash_book;
