-- Migration 1146: read-only. Why a manual cash book voucher defaults to
-- "receipt", and why choosing "debit" is rejected.
--
-- What the code says:
--   * cash_book.txn_type has allowed values 'receipt', 'payment', 'contra'
--     (migration 053) -- 'debit' is not one of them.
--   * The Type dropdown on the Cash Book form is NOT driven by those three.
--     It reads config_options where grp = 'txn_type' (useConfigOptions), and
--     only falls back to the hardcoded three when that table has no rows for
--     the group. So anything added to config_options appears in the dropdown
--     whether or not the database will accept it.
--
-- That is the shape of the bug: the dropdown and the constraint are two
-- separate lists that nobody keeps in step. This measures both before anything
-- is changed.
--
-- Nothing is written.

-- [1] The live constraint -- the definitive list of what will be accepted.
SELECT COALESCE(string_agg(pg_get_constraintdef(oid), ' | '), 'NO CHECK FOUND') AS txn_type_check
FROM pg_constraint
WHERE conrelid = 'public.cash_book'::regclass AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%txn_type%';

-- [2] What the dropdown is actually offering, active and inactive.
SELECT COALESCE(string_agg(value || ' (' || COALESCE(label,'-') || ', active='
                           || is_active || ')', ' | ' ORDER BY sort_order, value),
                'NO ROWS -- dropdown falls back to receipt/payment/contra') AS dropdown_options
FROM public.config_options WHERE grp = 'txn_type';

-- [3] Any dropdown option the constraint would refuse. Anything listed here is
-- an option a user can pick that cannot be saved.
SELECT COALESCE(string_agg(c.value, ', ' ORDER BY c.value), 'NONE -- all options are storable') AS unsaveable_options
FROM public.config_options c
WHERE c.grp = 'txn_type' AND c.is_active
  AND c.value NOT IN ('receipt','payment','contra');

-- [4] What is actually stored today, and how many rows are mislabelled --
-- typed 'receipt' but carrying a payment amount, or vice versa. The screenshot
-- shows a 05/05/2026 row badged "receipt" with Rs 1,500 in the PAYMENT column.
SELECT string_agg(t.txt, ' | ' ORDER BY t.txn_type) AS stored_types
FROM (SELECT txn_type, txn_type || '=' || count(*) AS txt
      FROM public.cash_book GROUP BY txn_type) t;

-- [5] The mislabelled rows, counted and dated, so the size of the clean-up is
-- known before anything is proposed.
SELECT count(*) FILTER (WHERE txn_type = 'receipt'
                          AND COALESCE(amount_out,0) > 0 AND COALESCE(amount_in,0) = 0)::int AS receipt_but_paid,
       count(*) FILTER (WHERE txn_type = 'payment'
                          AND COALESCE(amount_in,0) > 0 AND COALESCE(amount_out,0) = 0)::int AS payment_but_received,
       count(*) FILTER (WHERE COALESCE(amount_in,0) > 0 AND COALESCE(amount_out,0) > 0)::int AS both_sides_filled,
       count(*) FILTER (WHERE COALESCE(amount_in,0) = 0 AND COALESCE(amount_out,0) = 0)::int AS zero_both,
       (SELECT count(*)::int FROM public.cash_book) AS total_rows
FROM public.cash_book;
