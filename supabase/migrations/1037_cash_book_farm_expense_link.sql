ALTER TABLE public.cash_book
  ADD COLUMN IF NOT EXISTS farm_expense_id UUID REFERENCES public.farm_expenses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_book_farm_expense ON public.cash_book(farm_expense_id) WHERE farm_expense_id IS NOT NULL;

SELECT 'column' AS chk, count(*)::int AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cash_book' AND column_name = 'farm_expense_id';
