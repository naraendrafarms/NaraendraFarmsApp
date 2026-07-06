-- Migration 393: fix Empty Bags delete failing entirely.
--
-- cash_book.bag_sale_id and bank_transactions.bag_sale_id were added with a
-- plain REFERENCES public.bag_sales(id) FK (no ON DELETE action) — unlike
-- the working pattern for nhe_sale_id/he_dispatch_id (082_cash_book_source_ids.sql),
-- which are plain UUID columns with NO foreign key at all. Migration 263
-- already added an AFTER DELETE trigger on bag_sales to clean up cash_book,
-- and 270 added the same for bank_transactions — but that cleanup can never
-- run, because the FK constraint blocks the DELETE on bag_sales itself the
-- moment a cash_book/bank_transactions row still references it (constraint
-- violation happens before the AFTER DELETE trigger fires). This is exactly
-- why deleting an Empty Bags entry has been failing outright, and why the
-- cash_book entry was never getting auto-removed.
--
-- Fix: drop the FK constraints (matching the nhe_sale_id/he_dispatch_id
-- convention) — the existing AFTER DELETE triggers already handle cleanup
-- explicitly, so the FK was never needed for correctness, only in the way.

ALTER TABLE public.cash_book DROP CONSTRAINT IF EXISTS cash_book_bag_sale_id_fkey;
ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_bag_sale_id_fkey;

-- Also close out a much broader audit-log gap while we're here:
--   1. Migration 170's original attach-list included 'grn_entries', but the
--      real table has always been named 'grn' — so that entry silently
--      no-opped (EXCEPTION WHEN OTHERS swallows "relation does not exist")
--      and GRN/Purchase activity has NEVER been logged, despite looking
--      covered in the migration history.
--   2. bag_sales (Empty Bags) and several other regularly-used operational
--      tables were simply never added to any attach-list at all.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'grn', 'bag_sales', 'daily_feed', 'feed_production', 'medicine_usage',
    'medicine_purchases', 'hatch_batches', 'bonus', 'pending_payments',
    'partners', 'statutory_liabilities', 'generator_diesel_purchases',
    'generator_maintenance_log', 'vaccination_records', 'supplier_invoices',
    'feed_transfers', 'egg_conversions', 'egg_opening_stock', 'shed_transfers'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()', t
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- table may not exist, skip
    END;
  END LOOP;
END;
$$;

-- Verify: FK drop + which of the newly-targeted tables now actually have trg_audit
SELECT conname FROM pg_constraint
WHERE conname IN ('cash_book_bag_sale_id_fkey', 'bank_transactions_bag_sale_id_fkey');

SELECT event_object_table, count(*) AS trigger_events
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit'
  AND event_object_table IN (
    'grn', 'bag_sales', 'daily_feed', 'feed_production', 'medicine_usage',
    'medicine_purchases', 'hatch_batches', 'bonus', 'pending_payments',
    'partners', 'statutory_liabilities', 'generator_diesel_purchases',
    'generator_maintenance_log', 'vaccination_records', 'supplier_invoices',
    'feed_transfers', 'egg_conversions', 'egg_opening_stock', 'shed_transfers'
  )
GROUP BY event_object_table ORDER BY event_object_table;
