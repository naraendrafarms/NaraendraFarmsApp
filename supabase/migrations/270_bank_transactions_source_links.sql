-- Deleting a Bank-paid diesel purchase or bag sale never cleaned up its
-- bank_transactions entry (only the Cash -> cash_book path had this via
-- diesel_purchase_id / bag_sale_id + delete triggers). Add the same link +
-- trigger pattern for bank_transactions. Additive only — no existing data
-- touched.
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS diesel_purchase_id UUID REFERENCES public.generator_diesel_purchases(id),
  ADD COLUMN IF NOT EXISTS bag_sale_id UUID REFERENCES public.bag_sales(id);

CREATE OR REPLACE FUNCTION public.fn_delete_linked_bank_txn_diesel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.bank_transactions WHERE diesel_purchase_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_del_bank_txn_diesel ON public.generator_diesel_purchases;
CREATE TRIGGER trg_del_bank_txn_diesel
  AFTER DELETE ON public.generator_diesel_purchases
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_bank_txn_diesel();

CREATE OR REPLACE FUNCTION public.fn_delete_linked_bank_txn_bag_sale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.bank_transactions WHERE bag_sale_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_del_bank_txn_bag_sale ON public.bag_sales;
CREATE TRIGGER trg_del_bank_txn_bag_sale
  AFTER DELETE ON public.bag_sales
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_bank_txn_bag_sale();

NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
