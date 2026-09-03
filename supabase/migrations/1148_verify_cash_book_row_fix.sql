-- Migration 1148: read-only. Confirm the cash book row fix from 1147 actually
-- landed.
--
-- 1147 ran with Errors: 0 and its first verification printed, showing the
-- dropdown options corrected. Its SECOND verification produced no line in the
-- job log, so the row correction is unconfirmed -- and an unconfirmed fix is
-- not a fix. Measuring it directly.

SELECT count(*) FILTER (WHERE txn_type = 'receipt'
                          AND COALESCE(amount_out,0) > 0 AND COALESCE(amount_in,0) = 0)::int AS receipt_but_paid,
       count(*) FILTER (WHERE txn_type = 'payment'
                          AND COALESCE(amount_in,0) > 0 AND COALESCE(amount_out,0) = 0)::int AS payment_but_received,
       (SELECT string_agg(t.txt, ' | ' ORDER BY t.txn_type)
        FROM (SELECT txn_type, txn_type || '=' || count(*) AS txt
              FROM public.cash_book GROUP BY txn_type) t) AS stored_types,
       (SELECT count(*)::int FROM public.cash_book) AS total_rows,
       (SELECT round(sum(COALESCE(amount_in,0)) - sum(COALESCE(amount_out,0)), 2)
        FROM public.cash_book) AS net_balance;

-- The specific row from the screenshot: 05/05/2026, Rs 1,500, office tea.
SELECT COALESCE(string_agg(txn_date || ' ' || txn_type || ' in=' || COALESCE(amount_in,0)
                           || ' out=' || COALESCE(amount_out,0) || ' :: ' || left(description, 60),
                           ' | ' ORDER BY txn_date), 'NOT FOUND') AS the_row
FROM public.cash_book
WHERE txn_date = DATE '2026-05-05' AND COALESCE(amount_out,0) = 1500;
