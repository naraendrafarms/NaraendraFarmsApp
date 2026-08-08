-- Verification only for 590, whose checks fell past run_sql.py's 5-statement
-- print limit (its first statements were ALTERs returning no rows).

SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name), 'MISSING') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'statutory_liabilities' AND column_name = 'paid_via_partner_id')
    OR (table_name = 'bank_transactions' AND column_name = 'partner_id'));

-- The widened CHECK must actually accept advance_tax and late_fee.
SELECT pg_get_constraintdef(oid) AS liability_type_check
FROM pg_constraint
WHERE conrelid = 'public.statutory_liabilities'::regclass
  AND conname = 'statutory_liabilities_liability_type_check';

-- Existing rows untouched: all should still read as paid from our own account.
SELECT COUNT(*) AS liabilities_total,
       COUNT(paid_via_partner_id) AS marked_partner_paid
FROM public.statutory_liabilities;

-- Partners available to select as the payer.
SELECT COALESCE(string_agg(name, ', ' ORDER BY name), 'NONE') AS partners
FROM public.partners;
