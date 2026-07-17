-- Finished Feed Stock's Balance was purely Produced (feed_production_log)
-- minus Dispatched (feed_transfers) — no way to seed an opening balance
-- for a feed type that already had stock before it started being tracked
-- in this app (e.g. L3, 12 MT as of 01/04/2026). A fake Production log
-- entry would be the wrong fix (it has no ingredients, so it would
-- silently skew Production/Consumption reports and per-formula cost).
-- This table is a separate, dedicated adjustment ledger for finished feed,
-- mirroring Inventory's Adjustments pattern for raw materials.
CREATE TABLE IF NOT EXISTS public.finished_feed_adjustments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_type_id     UUID REFERENCES public.feed_types(id) ON DELETE CASCADE,
  adjustment_date  DATE NOT NULL,
  adjustment_type  TEXT NOT NULL DEFAULT 'Opening Stock',
  quantity_kg      NUMERIC(12,3) NOT NULL,  -- signed: negative for a downward correction
  rate_per_kg      NUMERIC(10,4),
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finished_feed_adj_type ON public.finished_feed_adjustments(feed_type_id);

ALTER TABLE public.finished_feed_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.finished_feed_adjustments FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

SELECT count(*) AS table_exists FROM information_schema.tables WHERE table_schema='public' AND table_name='finished_feed_adjustments';
