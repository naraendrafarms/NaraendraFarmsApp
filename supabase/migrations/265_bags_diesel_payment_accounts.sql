-- Bag Sales and Diesel Purchases had no way to say which account the money
-- moved through (Cash vs a specific bank like Kotak) — matching the
-- Cash → cash_book / Bank → bank_transactions pattern already used for
-- NHE/HE sales payments elsewhere in the app.
ALTER TABLE public.bag_sales
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash','Bank')),
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);

ALTER TABLE public.generator_diesel_purchases
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash','Bank')),
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);

-- Diesel purchases are real expenses — link to cash_book the same way
-- bag_sale_id already does, so deleting the purchase cleans up its entry.
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS diesel_purchase_id UUID REFERENCES public.generator_diesel_purchases(id);

CREATE OR REPLACE FUNCTION public.fn_delete_linked_cash_book_diesel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.cash_book WHERE diesel_purchase_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_del_cash_book_diesel ON public.generator_diesel_purchases;
CREATE TRIGGER trg_del_cash_book_diesel
  AFTER DELETE ON public.generator_diesel_purchases
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_cash_book_diesel();

NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
