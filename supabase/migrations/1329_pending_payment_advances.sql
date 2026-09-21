-- How much of each advance went against a bill.
--
-- A bill settled from an advance records advance_adjusted (the total) and
-- vendor_advance_id (ONE advance). That is fine while only one advance can be
-- picked. It stops being fine the moment two can: the reversal paths - the
-- edit form reverting a Paid bill, and the delete path - give the whole
-- advance_adjusted back to that single vendor_advance_id, which would
-- over-refund one advance and leave the other permanently overstated.
--
-- Measured need: a Maithri Solvents bill of Rs 2,40,051 against advances of
-- Rs 1,407 and Rs 2,38,644 - together exactly the bill, separately neither
-- covers it, so it cannot be settled at all today.
--
-- One row per advance used, with the amount taken from it. vendor_advance_id
-- and advance_adjusted stay exactly as they are, so every existing bill keeps
-- reading and reversing as it does now; the new rows are what the reversal
-- paths will prefer WHEN THEY EXIST, falling back to the old single pointer
-- when they do not.
--
-- No FK, per the repo rule preferring a delete trigger over FK CASCADE -
-- ALTER TABLE ADD CONSTRAINT can fail silently through run_sql.py. The
-- trigger follows in the next migration.

CREATE TABLE IF NOT EXISTS public.pending_payment_advances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL,
  advance_id  UUID NOT NULL,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  adjusted_on DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppa_payment ON public.pending_payment_advances(payment_id);

ALTER TABLE public.pending_payment_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY pending_payment_advances_all ON public.pending_payment_advances
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Verification ─────────────────────────────────────────────────────────
SELECT (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema='public' AND table_name='pending_payment_advances') AS table_exists,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='pending_payment_advances') AS columns,
       (SELECT count(*)::int FROM pg_indexes
        WHERE schemaname='public' AND indexname='idx_ppa_payment') AS index_exists,
       (SELECT count(*)::int FROM pg_policies
        WHERE schemaname='public' AND tablename='pending_payment_advances') AS policies,
       (SELECT count(*)::int FROM public.pending_payment_advances) AS rows_now,
       (SELECT count(*)::int FROM public.vendor_advances) AS advances_untouched,
       (SELECT count(*)::int FROM public.pending_payments WHERE vendor_advance_id IS NOT NULL) AS bills_on_an_advance;
