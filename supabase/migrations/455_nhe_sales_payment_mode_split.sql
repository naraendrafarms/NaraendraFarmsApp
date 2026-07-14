-- Bird sale entries paid partly cash + partly online set
-- nhe_sales.payment_mode = 'Cash+NEFT' (FlockSalesPages.tsx), but the
-- check constraint (migration 338) never allowed that value — every split
-- cash/online bird sale failed to save with
-- "violates check constraint nhe_sales_payment_mode_check". The separate
-- cash_book / bank_transactions rows already correctly record each
-- component's amount independently, so payment_mode here is purely a
-- display label — widen the constraint to match the value the app has
-- always intended to write, rather than collapsing it to a single mode
-- and losing that this was a split payment.
ALTER TABLE public.nhe_sales DROP CONSTRAINT IF EXISTS nhe_sales_payment_mode_check;
ALTER TABLE public.nhe_sales ADD CONSTRAINT nhe_sales_payment_mode_check
  CHECK (payment_mode IN ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance','Cash+NEFT'));

SELECT count(*) AS constraint_exists FROM information_schema.check_constraints
WHERE constraint_name = 'nhe_sales_payment_mode_check';
