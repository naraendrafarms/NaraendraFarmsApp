-- Verification for 621, whose own checks sat at statements 6-8 and were never
-- printed — run_sql.py prints only the first 5. 621 reported "Errors: 0", but
-- that runner also treats "does not exist" / "already exists" as success, so a
-- green log proves nothing on its own. Confirm the columns, the widened CHECK
-- and the backfill actually landed.

-- 1. The two new columns must exist.
SELECT COALESCE(string_agg(column_name || ' ' || data_type, ', ' ORDER BY column_name), 'MISSING — NOT ADDED') AS split_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'he_dispatch'
  AND column_name IN ('payment_cash', 'payment_online');

-- 2. The CHECK must now accept 'Cash+NEFT', or every split save will be
--    rejected by the database.
SELECT COALESCE(pg_get_constraintdef(oid), 'CONSTRAINT MISSING') AS payment_mode_check
FROM pg_constraint WHERE conname = 'he_dispatch_payment_mode_check';

-- 3. The backfill: for every dispatch already marked paid, cash + online must
--    reconcile to amount_received, except advance-adjusted ones which stay at
--    zero by design (their money sits in party_advances, not cash or bank).
SELECT COUNT(*) AS paid_dispatches,
       COUNT(*) FILTER (WHERE COALESCE(payment_cash,0) + COALESCE(payment_online,0)
                              = COALESCE(amount_received,0)) AS split_reconciles,
       COUNT(*) FILTER (WHERE payment_mode = 'Advance') AS advance_paid_at_zero,
       COUNT(*) FILTER (WHERE payment_mode <> 'Advance'
                          AND COALESCE(payment_cash,0) + COALESCE(payment_online,0)
                              <> COALESCE(amount_received,0)) AS unexplained_mismatches
FROM public.he_dispatch
WHERE COALESCE(amount_received, 0) > 0;

-- 4. What the split columns now hold, by mode — a sanity read rather than a
--    claim that it worked.
SELECT COALESCE(string_agg(m || ': cash=' || c || ' online=' || o || ' rows=' || n, ' | ' ORDER BY m), 'NONE') AS by_mode
FROM (
  SELECT COALESCE(payment_mode,'(none)') AS m,
         ROUND(SUM(COALESCE(payment_cash,0))) AS c,
         ROUND(SUM(COALESCE(payment_online,0))) AS o,
         COUNT(*) AS n
  FROM public.he_dispatch WHERE COALESCE(amount_received,0) > 0
  GROUP BY 1
) x;

-- 5. nhe_sales already had this; confirm both tables now agree in shape so the
--    shared Receive Payment modal can write to either.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name), 'MISSING') AS both_tables
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('he_dispatch', 'nhe_sales')
  AND column_name IN ('payment_cash', 'payment_online');
