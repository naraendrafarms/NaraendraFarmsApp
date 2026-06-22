-- Migration 119: Add missing bank accounts (fix column name from 118)

-- Remove bad rows if 118 partially inserted anything
DELETE FROM public.bank_accounts
WHERE bank_name IN ('Kotak Mahindra Bank','Partner Account')
  AND account_no IS NULL
  AND ifsc IS NULL;

-- Re-insert with correct column names
INSERT INTO public.bank_accounts (bank_name, account_name, account_no, ifsc, is_active)
VALUES
  ('Kotak Mahindra Bank', 'Naraendra Farms - Kotak', NULL, NULL, true),
  ('Dendi Naraendra Reddy', 'Dendi Naraendra Reddy Partner Account', NULL, NULL, true);

-- Diagnostic: show all active bank accounts
SELECT id, bank_name, account_name, is_active FROM public.bank_accounts WHERE is_active = true ORDER BY bank_name;

NOTIFY pgrst, 'reload schema';
