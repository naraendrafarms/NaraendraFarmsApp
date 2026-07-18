-- Purchase Orders (Import PO + manual Add PO) stored item as free text only,
-- with no link back to Items Master — every import/manual entry risked
-- creating a slightly-different-spelled duplicate instead of resolving to
-- the same real item. Add item_id so it can be linked the same way
-- Vaccination Schedule/Medicines Master already are (see itemAliases.ts).
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_item_id ON public.purchase_orders(item_id);
