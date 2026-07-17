-- bank_transactions.nhe_sale_id / he_dispatch_id / vendor_advance_id and
-- cash_book/bank_transactions.party_advance_id are bare UUID columns with
-- NO foreign key at all (confirmed by audit) — only specific frontend
-- delete paths clean them up, and several delete paths don't (found and
-- partially fixed elsewhere this session for Flock Sales/Vendor Advances).
-- Add real FK constraints as a database-level backstop: ON DELETE CASCADE,
-- since these are all secondary ledger rows representing money tied to a
-- parent record — if the parent is genuinely deleted, the ledger row
-- should go with it (matching the bag_sales/diesel_purchases pattern
-- already fixed via migration 393).
--
-- Clean up any pre-existing orphans first so the FK can actually be added.
DELETE FROM public.bank_transactions bt
  WHERE bt.nhe_sale_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.nhe_sales s WHERE s.id = bt.nhe_sale_id);
DELETE FROM public.bank_transactions bt
  WHERE bt.he_dispatch_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.he_dispatch d WHERE d.id = bt.he_dispatch_id);
DELETE FROM public.bank_transactions bt
  WHERE bt.vendor_advance_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.vendor_advances a WHERE a.id = bt.vendor_advance_id);
DELETE FROM public.cash_book cb
  WHERE cb.vendor_advance_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.vendor_advances a WHERE a.id = cb.vendor_advance_id);
DELETE FROM public.bank_transactions bt
  WHERE bt.party_advance_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.party_advances a WHERE a.id = bt.party_advance_id);
DELETE FROM public.cash_book cb
  WHERE cb.party_advance_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.party_advances a WHERE a.id = cb.party_advance_id);

ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_nhe_sale_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_nhe_sale_id_fkey
  FOREIGN KEY (nhe_sale_id) REFERENCES public.nhe_sales(id) ON DELETE CASCADE;

ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_he_dispatch_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_he_dispatch_id_fkey
  FOREIGN KEY (he_dispatch_id) REFERENCES public.he_dispatch(id) ON DELETE CASCADE;

ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_vendor_advance_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_vendor_advance_id_fkey
  FOREIGN KEY (vendor_advance_id) REFERENCES public.vendor_advances(id) ON DELETE CASCADE;

ALTER TABLE public.cash_book DROP CONSTRAINT IF EXISTS cash_book_vendor_advance_id_fkey;
ALTER TABLE public.cash_book ADD CONSTRAINT cash_book_vendor_advance_id_fkey
  FOREIGN KEY (vendor_advance_id) REFERENCES public.vendor_advances(id) ON DELETE CASCADE;

ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_party_advance_id_fkey;
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_party_advance_id_fkey
  FOREIGN KEY (party_advance_id) REFERENCES public.party_advances(id) ON DELETE CASCADE;

ALTER TABLE public.cash_book DROP CONSTRAINT IF EXISTS cash_book_party_advance_id_fkey;
ALTER TABLE public.cash_book ADD CONSTRAINT cash_book_party_advance_id_fkey
  FOREIGN KEY (party_advance_id) REFERENCES public.party_advances(id) ON DELETE CASCADE;

SELECT count(*) AS fks_added FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY' AND constraint_name IN (
    'bank_transactions_nhe_sale_id_fkey','bank_transactions_he_dispatch_id_fkey',
    'bank_transactions_vendor_advance_id_fkey','cash_book_vendor_advance_id_fkey',
    'bank_transactions_party_advance_id_fkey','cash_book_party_advance_id_fkey'
  );
