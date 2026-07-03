-- Break down the 127 Paid-but-no-cash_book bills to see whether this is
-- mostly old/legacy paid bills (predating any ledger tracking) or genuine
-- cases matching the bank-account bug (bank_account_id set, meaning they
-- went through the new bank-detail flow but the ledger never got the entry).
SELECT
  COUNT(*) FILTER (WHERE bank_account_id IS NOT NULL) AS with_bank_account,
  COUNT(*) FILTER (WHERE bank_account_id IS NULL AND lower(coalesce(account_type,'')) = 'cash') AS cash_no_bank,
  COUNT(*) FILTER (WHERE bank_account_id IS NULL AND lower(coalesce(account_type,'')) <> 'cash') AS noncash_no_bank_selected,
  MIN(pay_before_date) AS earliest_due_date,
  MAX(pay_before_date) AS latest_due_date,
  MIN(created_at) AS earliest_created,
  MAX(created_at) AS latest_created
FROM public.pending_payments
WHERE payment_status = 'Paid'
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pending_payments.id);

-- created_at distribution by month, to see if these are old legacy bills
-- or recent ones (recent = likely genuine bug hits worth backfilling)
SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*) AS cnt
FROM public.pending_payments
WHERE payment_status = 'Paid'
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pending_payments.id)
GROUP BY 1 ORDER BY 1;
