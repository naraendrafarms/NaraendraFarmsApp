-- Migration 042: Add qty_packs and pack_size to purchase_orders
-- qty_packs = number of bags/packs ordered
-- pack_size = weight/volume per pack (e.g. 25 Kg per bag)
-- rate remains per base unit (Kg/Ltr etc.) = rate_per_bag / pack_size
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS qty_packs  INTEGER,
  ADD COLUMN IF NOT EXISTS pack_size  NUMERIC(10,3);

NOTIFY pgrst, 'reload schema';
