-- Migration 1147: make the Cash Book Type dropdown match what the database
-- will actually accept, and correct the one row the mismatch produced.
--
-- WHAT WAS WRONG (measured by 1146, not assumed):
--   cash_book.txn_type CHECK allows  receipt | payment | contra
--   config_options grp='txn_type' held  credit | debit  -- and nothing else
--   so BOTH dropdown options were unsaveable and no manual voucher could be
--   entered at all. The form's hardcoded starting value 'receipt' is why one
--   voucher still saved, and saved as a receipt while carrying a payment
--   amount: 05/05/2026, Rs 1,500, office tea expense.
--
-- Owner chose option A: keep the cash book's own vocabulary. The Bank Ledger
-- has its own Credit/Debit on a different table where that language belongs;
-- the cash book has spoken receipt/payment/contra across all 1,254 rows.
--
-- The three correct options are SEEDED rather than left to the code's
-- empty-list fallback. Relying on the group being empty is how this broke --
-- one stray row in config_options silently replaced the whole list. With the
-- three seeded, an added row can only ever ADD to a working list.
--
-- credit and debit are DEACTIVATED, not deleted, so if either was ever meant
-- for something the row and its label survive and can be turned back on.

DO $$
BEGIN
  -- Retire the two unsaveable options.
  UPDATE public.config_options
  SET is_active = FALSE
  WHERE grp = 'txn_type' AND value IN ('credit','debit');

  -- Seed the three the database actually accepts.
  INSERT INTO public.config_options (grp, value, label, sort_order, is_active) VALUES
    ('txn_type','receipt','Receipt (money in)',  1, TRUE),
    ('txn_type','payment','Payment (money out)', 2, TRUE),
    ('txn_type','contra', 'Contra (transfer)',   3, TRUE)
  ON CONFLICT (grp, value) DO UPDATE
    SET is_active = TRUE, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

  -- The single row the mismatch produced. Guarded on being exactly the row
  -- 1146 measured -- typed receipt, money actually paid out -- so it cannot
  -- catch a genuine receipt.
  UPDATE public.cash_book
  SET txn_type = 'payment'
  WHERE txn_type = 'receipt'
    AND COALESCE(amount_out,0) > 0
    AND COALESCE(amount_in,0) = 0;
END
$$;

-- VERIFY 1: the dropdown now offers exactly the three storable options, and
-- nothing active is left that the CHECK would refuse.
SELECT string_agg(value || '=' || is_active, ' | ' ORDER BY sort_order, value) AS all_txn_type_options,
       count(*) FILTER (WHERE is_active)::int AS active_options,
       count(*) FILTER (WHERE is_active AND value NOT IN ('receipt','payment','contra'))::int AS unsaveable_left
FROM public.config_options WHERE grp = 'txn_type';

-- VERIFY 2: no row is typed one way and carrying the opposite amount, the
-- totals still add up, and nothing was lost.
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
