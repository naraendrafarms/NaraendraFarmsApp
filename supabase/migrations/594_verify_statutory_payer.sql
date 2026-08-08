-- Verification only for 593, whose checks fell past run_sql.py's 5-statement
-- print limit (its leading statements were ALTERs returning no rows).

SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name), 'MISSING') AS payer_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'statutory_liabilities' AND column_name IN ('paid_via_party_id','paid_via_partner_id'))
    OR (table_name = 'bank_transactions' AND column_name IN ('party_id','partner_id')));

-- Only one payer may be set on a liability.
SELECT COALESCE(pg_get_constraintdef(oid), 'MISSING') AS one_payer_check
FROM pg_constraint
WHERE conrelid = 'public.statutory_liabilities'::regclass
  AND conname = 'statutory_liabilities_one_payer';

-- The payer the user will actually pick, and how many payers are selectable.
SELECT (SELECT COUNT(*) FROM public.parties)  AS selectable_parties,
       (SELECT COUNT(*) FROM public.partners) AS selectable_partners,
       (SELECT COALESCE(string_agg(name, ', '), 'NOT FOUND')
          FROM public.parties WHERE name ILIKE '%hitech%') AS hitech_party;

-- Existing rows untouched.
SELECT COUNT(*) AS liabilities_total,
       COUNT(paid_via_party_id) AS party_paid,
       COUNT(paid_via_partner_id) AS partner_paid
FROM public.statutory_liabilities;
