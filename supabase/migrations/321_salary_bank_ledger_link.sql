-- Salary payments currently post to NO ledger at all (cash_book.category
-- already anticipated 'salary' as a valid value per its own comment, but
-- nothing ever wired it up). User confirmed: wire salary Paid -> Cash Book
-- (+ Bank Ledger for non-cash) same as Pending Payments / Purchase Entry.
-- Purely additive nullable columns — no existing data touched.

ALTER TABLE public.salary_monthly
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS salary_monthly_id UUID REFERENCES public.salary_monthly(id) ON DELETE SET NULL;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS salary_monthly_id UUID REFERENCES public.salary_monthly(id) ON DELETE SET NULL;

SELECT 'ok' AS chk;
