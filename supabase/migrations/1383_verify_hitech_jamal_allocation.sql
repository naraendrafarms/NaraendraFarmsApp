-- READ ONLY. Proves what 1382 actually did.
-- Separate file because run_sql.py prints only the FIRST 5 statements, and
-- 1382's own checks would have fallen outside that window.

SELECT 'heBackup=' || (SELECT COUNT(*)::int FROM public.he_dispatch_backup_1382)
    || ' bankBackup=' || (SELECT COUNT(*)::int FROM public.bank_transactions_backup_1382)
    || ' settlementsNow=' || (SELECT COUNT(*)::int FROM public.bank_txn_settlements)
    || ' creditsUsed=' || (SELECT COUNT(DISTINCT bank_txn_id)::int FROM public.bank_txn_settlements)
    AS backups_and_settlements;

SELECT 'hitechInvoices=' || COUNT(*)
    || ' received=' || COUNT(*) FILTER (WHERE payment_status = 'Received')
    || ' partial=' || COUNT(*) FILTER (WHERE payment_status = 'Partial')
    || ' stillDue=' || ROUND(COALESCE(SUM(GREATEST(amount - COALESCE(tds_amount,0) - COALESCE(amount_received,0), 0)),0)/100000.0, 2) || 'L'
    AS hitech_after
  FROM public.he_dispatch
 WHERE party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095' AND COALESCE(amount,0) > 0;

SELECT 'jamalInvoices=' || COUNT(*)
    || ' received=' || COUNT(*) FILTER (WHERE payment_status = 'Received')
    || ' partial=' || COUNT(*) FILTER (WHERE payment_status = 'Partial')
    || ' stillDue=' || ROUND(COALESCE(SUM(GREATEST(amount - COALESCE(tds_amount,0) - COALESCE(amount_received,0), 0)),0)/100000.0, 2) || 'L'
    AS jamal_after
  FROM public.he_dispatch
 WHERE party_id = 'cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0' AND COALESCE(amount,0) > 0;

-- The pre-Flock-19 Hitech money MUST still be sitting untouched.
SELECT 'preSep2025Credits=' || COUNT(*)
    || ' total=' || ROUND(COALESCE(SUM(amount),0)/10000000.0, 2) || 'Cr'
    || ' stillUnlinked=' || COUNT(*) FILTER (WHERE he_dispatch_id IS NULL AND nhe_sale_id IS NULL)
    AS untouched_early_money
  FROM public.bank_transactions
 WHERE party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095'
   AND txn_type = 'Credit' AND txn_date < '2025-09-01';

-- Nothing may be over-applied: a credit whose settled_amount exceeds the
-- credit itself would mean money counted twice.
SELECT 'overApplied=' || COUNT(*) FILTER (WHERE COALESCE(settled_amount,0) > amount + 1)
    || ' anyNegativeDue=' || (SELECT COUNT(*)::int FROM public.he_dispatch
         WHERE party_id IN ('436decba-1b4f-4dbe-91fa-e8c9d794e095','cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0')
           AND COALESCE(amount_received,0) > ROUND(amount - COALESCE(tds_amount,0), 2) + 1)
    AS integrity
  FROM public.bank_transactions
 WHERE txn_type = 'Credit'
   AND party_id IN ('436decba-1b4f-4dbe-91fa-e8c9d794e095','cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0');
