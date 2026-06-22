-- Migration 135: Cash Book opening balance persistence + duplicate payment guard
-- Batch 1 (data integrity)
--   1. Server-side opening balance (was browser localStorage — lost on cache clear,
--      different per user, no audit). Keyed by location: 'all' / 'ho' / farm UUID.
--   2. De-duplicate cash_book rows that point at the same sale/dispatch, then add a
--      partial UNIQUE index so the delete-then-reinsert payment flow can never
--      create two cash entries for one sale (race condition fix).

-- 1. Opening balance table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_book_opening (
  location_key TEXT PRIMARY KEY,          -- 'all', 'ho', or a farm UUID (as text)
  balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cash_book_opening ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cbo_read   ON public.cash_book_opening;
DROP POLICY IF EXISTS cbo_insert ON public.cash_book_opening;
DROP POLICY IF EXISTS cbo_update ON public.cash_book_opening;
DROP POLICY IF EXISTS cbo_delete ON public.cash_book_opening;
CREATE POLICY cbo_read   ON public.cash_book_opening FOR SELECT TO authenticated USING (true);
CREATE POLICY cbo_insert ON public.cash_book_opening FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cbo_update ON public.cash_book_opening FOR UPDATE TO authenticated USING (true);
CREATE POLICY cbo_delete ON public.cash_book_opening FOR DELETE TO authenticated USING (true);

-- 2. De-duplicate existing cash_book rows by source id ---------------------------
-- Keep the physically-first row per nhe_sale_id, delete the rest.
DELETE FROM public.cash_book a
USING public.cash_book b
WHERE a.nhe_sale_id IS NOT NULL
  AND a.nhe_sale_id = b.nhe_sale_id
  AND a.ctid > b.ctid;

DELETE FROM public.cash_book a
USING public.cash_book b
WHERE a.he_dispatch_id IS NOT NULL
  AND a.he_dispatch_id = b.he_dispatch_id
  AND a.ctid > b.ctid;

-- 3. Partial UNIQUE indexes — one cash entry per sale / dispatch -----------------
DROP INDEX IF EXISTS public.uq_cash_book_nhe_sale_id;
DROP INDEX IF EXISTS public.uq_cash_book_he_dispatch_id;
CREATE UNIQUE INDEX uq_cash_book_nhe_sale_id
  ON public.cash_book(nhe_sale_id) WHERE nhe_sale_id IS NOT NULL;
CREATE UNIQUE INDEX uq_cash_book_he_dispatch_id
  ON public.cash_book(he_dispatch_id) WHERE he_dispatch_id IS NOT NULL;

-- Diagnostic
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='cash_book_opening') AS opening_table,
  (SELECT COUNT(*) FROM pg_indexes
   WHERE schemaname='public' AND indexname='uq_cash_book_nhe_sale_id') AS nhe_uq_index,
  (SELECT COUNT(*) FROM pg_indexes
   WHERE schemaname='public' AND indexname='uq_cash_book_he_dispatch_id') AS he_uq_index;
