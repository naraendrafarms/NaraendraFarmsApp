-- Consolidate the one real historical batch (198 rows, ref FCM-260710NZF59W,
-- 2026-07-10, total 2056780.00) created by the old per-employee bulk-pay
-- code into a single bank_transactions row, matching the real bank
-- statement and the new one-row-per-batch behavior going forward.
DO $$
DECLARE
  v_new_txn_id UUID;
  v_bank_account_id UUID;
  v_ref TEXT := 'FCM-260710NZF59W';
  v_date DATE := '2026-07-10';
  v_total NUMERIC;
  v_count INT;
BEGIN
  SELECT max(bank_account_id), sum(amount), count(*)
    INTO v_bank_account_id, v_total, v_count
  FROM public.bank_transactions
  WHERE reference_no = v_ref AND txn_date = v_date AND salary_monthly_id IS NOT NULL;

  IF v_count IS NULL OR v_count = 0 THEN
    RAISE NOTICE 'No matching rows found for ref=%, date=% — nothing to do', v_ref, v_date;
    RETURN;
  END IF;

  INSERT INTO public.bank_transactions (bank_account_id, txn_date, txn_type, category, reference_no, description, amount)
  VALUES (v_bank_account_id, v_date, 'Debit', 'Salary Payment', v_ref, 'Salary batch — ' || v_count || ' employee(s) (consolidated)', v_total)
  RETURNING id INTO v_new_txn_id;

  UPDATE public.salary_monthly sm
  SET bank_txn_id = v_new_txn_id
  WHERE sm.id IN (
    SELECT salary_monthly_id FROM public.bank_transactions
    WHERE reference_no = v_ref AND txn_date = v_date AND salary_monthly_id IS NOT NULL
  );

  DELETE FROM public.bank_transactions
  WHERE reference_no = v_ref AND txn_date = v_date AND salary_monthly_id IS NOT NULL;

  RAISE NOTICE 'Consolidated % rows (total %) into bank_transactions id %', v_count, v_total, v_new_txn_id;
END $$;

SELECT 'sentinel' AS marker, 1 AS n;

SELECT reference_no, txn_date, count(*) AS rows_now, sum(amount) AS total
FROM bank_transactions WHERE reference_no = 'FCM-260710NZF59W'
GROUP BY reference_no, txn_date;

SELECT count(*) AS salary_rows_linked FROM salary_monthly sm
JOIN bank_transactions bt ON bt.id = sm.bank_txn_id
WHERE bt.reference_no = 'FCM-260710NZF59W';
