-- Migration 091: Inventory / Stock Management (all GRN items)
-- Stock is keyed by item_name (the common key across grn, feed_production_ingredients
-- and feed_stock_adjustments). This migration adds valuation + per-item classification.

-- 1. Valuation columns on the existing adjustments table (reused for Opening + Adjustments)
ALTER TABLE public.feed_stock_adjustments ADD COLUMN IF NOT EXISTS rate NUMERIC(12,4);
ALTER TABLE public.feed_stock_adjustments ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.feed_stock_adjustments ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Per-item metadata: category, unit, reorder level (for alerts), active flag.
--    item_name is stored lower-cased so lookups are case-insensitive.
CREATE TABLE IF NOT EXISTS public.stock_item_meta (
  item_key      TEXT PRIMARY KEY,          -- lower(trim(item_name))
  item_name     TEXT NOT NULL,             -- display name
  category      TEXT DEFAULT 'Other',      -- Feed / Medicine / Vaccine / Packaging / Spares / Chemical / Other
  unit          TEXT DEFAULT 'kg',
  reorder_level NUMERIC(14,3) DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_item_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.stock_item_meta;
CREATE POLICY "auth_all" ON public.stock_item_meta FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

NOTIFY pgrst, 'reload schema';

-- Diagnostic: confirm new objects exist
SELECT count(*) AS meta_table_ready FROM information_schema.tables
WHERE table_schema='public' AND table_name='stock_item_meta';
