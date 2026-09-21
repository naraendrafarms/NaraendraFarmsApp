-- Which invoices a bank receipt actually settled, and how much went to each.
--
-- Today bank_transactions carries ONE nhe_sale_id and ONE he_dispatch_id, so a
-- receipt covering several invoices can only name the first of each. The edit
-- modal then shows "settled Rs 52,29,999" beside a single invoice worth
-- Rs 24,13,855, and the rest is unaccounted for on screen. Measured 21/09/2026:
-- of 80 receipts carrying a settlement, 5 settle more than the invoice they
-- name - 52,34,999 / 52,29,999 / 50,62,355 / 47,16,625 / 28,618.
--
-- utr_ref cannot stand in for the link: 47 HE invoices carrying one match 58
-- bank rows, so references repeat and matching on them would sometimes name
-- the WRONG invoice. A wrong invoice on screen is worse than a missing one.
--
-- So: one row per invoice a receipt settled, with the amount applied to it -
-- which nothing records today either. Nothing existing is altered; this table
-- starts empty and fills as new settlements are made. The 5 historical entries
-- keep reading exactly as they do now, because which lakh went to which
-- invoice cannot be reconstructed with certainty and guessing it into the
-- books would be worse than leaving it plain.
--
-- No FK to bank_transactions on purpose, per the repo rule preferring a DELETE
-- trigger over FK CASCADE: ALTER TABLE ADD CONSTRAINT can fail silently
-- through run_sql.py. The trigger comes in the next migration.

CREATE TABLE IF NOT EXISTS public.bank_txn_settlements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_txn_id  UUID NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('nhe_sales','he_dispatch')),
  invoice_id   UUID NOT NULL,
  amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  settled_on   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_txn_settlements_txn
  ON public.bank_txn_settlements(bank_txn_id);

ALTER TABLE public.bank_txn_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY bank_txn_settlements_all ON public.bank_txn_settlements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Verification ─────────────────────────────────────────────────────────
-- run_sql.py reports "already exists" as success, so a CREATE that did nothing
-- would still show Errors: 0. Prove the table, its columns, the index and the
-- policy are really there, and that it starts empty.
SELECT (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema='public' AND table_name='bank_txn_settlements') AS table_exists,
       (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='bank_txn_settlements') AS columns,
       (SELECT count(*)::int FROM pg_indexes
        WHERE schemaname='public' AND indexname='idx_bank_txn_settlements_txn') AS index_exists,
       (SELECT count(*)::int FROM pg_policies
        WHERE schemaname='public' AND tablename='bank_txn_settlements') AS policies,
       (SELECT count(*)::int FROM public.bank_txn_settlements) AS rows_now,
       (SELECT count(*)::int FROM public.bank_transactions) AS bank_rows_untouched;
