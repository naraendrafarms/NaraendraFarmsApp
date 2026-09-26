-- How much of each buyer advance went against a sale.
--
-- THE NEED, measured from the owner's own screen 26/09/2026: Srishailam Kavali
-- Eggs Moinabad, HE dispatch invoice Rs 1,59,354.00, against advances of
-- Rs 1,888.00 (19/09, TSABH00001171498) and Rs 1,50,000.00 (25/09, UBIN0809110)
-- = Rs 1,51,888.00, leaving Rs 7,466.00 to come in as cash. TODAY THAT CANNOT
-- BE ENTERED AT ALL:
--   1. he_dispatch.party_advance_id is ONE uuid, so only one advance fits;
--   2. the Advance branch of the receipt window RETURNS before any cash_book or
--      bank_transactions insert, so advance-plus-cash is impossible;
--   3. re-saving REVERSES the previous advance first, so adjusting the second
--      would silently undo the first.
-- Bulk Receipt has no advance support either, so there is no way round it.
--
-- This is the SALES mirror of pending_payment_advances (1329), which solved the
-- identical problem on the purchase side for a Maithri Solvents bill. Same
-- shape, same reasoning, so the two sides behave alike.
--
-- party_advance_id and advance_adjusted STAY EXACTLY AS THEY ARE. Every sale
-- settled before today keeps reading and reversing as it does now; these rows
-- are what the reversal path prefers WHEN THEY EXIST, falling back to the old
-- single pointer when they do not. Nothing is migrated or rewritten.
--
-- sale_table names which book the sale is in, because a buyer advance can be
-- adjusted against either an HE dispatch or an NHE sale.
--
-- NO FOREIGN KEY, per the repo rule preferring a delete trigger over FK CASCADE:
-- ALTER TABLE ADD CONSTRAINT can fail silently through run_sql.py. The cleanup
-- trigger follows in 1370, exactly as 1330 followed 1329.

CREATE TABLE IF NOT EXISTS public.sale_advance_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL,
  sale_table  TEXT NOT NULL CHECK (sale_table IN ('he_dispatch','nhe_sales')),
  advance_id  UUID NOT NULL,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  adjusted_on DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saa_sale ON public.sale_advance_allocations(sale_id);
CREATE INDEX IF NOT EXISTS idx_saa_advance ON public.sale_advance_allocations(advance_id);

ALTER TABLE public.sale_advance_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY sale_advance_allocations_all ON public.sale_advance_allocations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rule 1d: a new table gets NO automatic Data API grant after 30 October, and
-- without this the page reading it would show nothing while the migration still
-- reported Errors: 0.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_advance_allocations TO anon, authenticated, service_role;

-- ── Verification ─────────────────────────────────────────────────────────
SELECT (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema='public' AND table_name='sale_advance_allocations') AS table_exists,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='sale_advance_allocations') AS columns,
       (SELECT count(*)::int FROM pg_indexes
        WHERE schemaname='public' AND indexname IN ('idx_saa_sale','idx_saa_advance')) AS indexes,
       (SELECT count(*)::int FROM pg_policies
        WHERE schemaname='public' AND tablename='sale_advance_allocations') AS policies,
       (SELECT count(*)::int FROM public.sale_advance_allocations) AS rows_now,
       has_table_privilege('authenticated','public.sale_advance_allocations','SELECT') AS auth_can_read,
       has_table_privilege('anon','public.sale_advance_allocations','SELECT') AS anon_can_read;

-- Nothing about existing advances or sales is touched by this migration.
SELECT (SELECT count(*)::int FROM public.party_advances) AS advances_untouched,
       (SELECT count(*)::int FROM public.he_dispatch WHERE party_advance_id IS NOT NULL) AS he_on_an_advance,
       (SELECT count(*)::int FROM public.nhe_sales WHERE party_advance_id IS NOT NULL) AS nhe_on_an_advance;
