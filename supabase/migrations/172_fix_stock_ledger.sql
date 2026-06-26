-- Migration 172: Fix stock_ledger
-- Problem: fn_grn_to_stock_ledger used wrong column names (quantity/unit_price)
--          GRN table actual columns are qty and price_per_unit.
--          Every GRN insert silently failed → stock_ledger is empty.
-- Fix:  1. Correct the GRN trigger column names
--       2. Add adj_id FK column so adjustments can be tracked in stock_ledger
--       3. Add trigger: feed_stock_adjustments → stock_ledger
--       4. Backfill all existing GRN + adjustment data

-- ── Step 1: Add adj_id column ─────────────────────────────────────────────────
ALTER TABLE public.stock_ledger
  ADD COLUMN IF NOT EXISTS adj_id UUID REFERENCES public.feed_stock_adjustments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sl_adj_id ON public.stock_ledger(adj_id) WHERE adj_id IS NOT NULL;

-- ── Step 2: Fix GRN trigger (qty + price_per_unit) ───────────────────────────
CREATE OR REPLACE FUNCTION public.fn_grn_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stock_ledger(
      txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
      grn_id, farm_id, reference_no, remarks)
    VALUES(
      COALESCE(NEW.grn_date, CURRENT_DATE), 'grn_in',
      NEW.item_id, COALESCE(NEW.item_name, ''),
      COALESCE(NEW.qty, 0), NEW.unit, NEW.price_per_unit,
      COALESCE(NEW.total_amount, (COALESCE(NEW.qty,0) * COALESCE(NEW.price_per_unit,0))),
      NEW.id, NEW.farm_id, NEW.grn_no, NEW.remarks
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger SET
      txn_date    = COALESCE(NEW.grn_date, CURRENT_DATE),
      item_id     = NEW.item_id,
      item_name   = COALESCE(NEW.item_name, ''),
      qty         = COALESCE(NEW.qty, 0),
      unit        = NEW.unit,
      unit_price  = NEW.price_per_unit,
      total_value = COALESCE(NEW.total_amount, (COALESCE(NEW.qty,0) * COALESCE(NEW.price_per_unit,0))),
      reference_no = NEW.grn_no,
      remarks     = NEW.remarks,
      farm_id     = NEW.farm_id
    WHERE grn_id = NEW.id AND txn_type = 'grn_in';
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger WHERE grn_id = OLD.id AND txn_type = 'grn_in';
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_grn_to_stock_ledger error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── Step 3: Backfill GRN data ─────────────────────────────────────────────────
-- Remove any stale qty=0 ghost rows from old broken trigger
DELETE FROM public.stock_ledger
WHERE txn_type = 'grn_in' AND grn_id IS NOT NULL AND qty = 0;

INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
  grn_id, farm_id, reference_no, remarks)
SELECT
  COALESCE(g.grn_date, g.created_at::DATE, CURRENT_DATE),
  'grn_in',
  g.item_id,
  COALESCE(g.item_name, ''),
  COALESCE(g.qty, 0),
  g.unit,
  g.price_per_unit,
  COALESCE(g.total_amount, (COALESCE(g.qty,0) * COALESCE(g.price_per_unit,0))),
  g.id,
  g.farm_id,
  g.grn_no,
  g.remarks
FROM public.grn g
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.grn_id = g.id AND sl.txn_type = 'grn_in'
)
AND COALESCE(g.qty, 0) > 0;

-- ── Step 4: Adjustments trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_adj_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stock_ledger(
      txn_date, txn_type, item_name, qty, unit, unit_price, remarks, adj_id)
    VALUES(
      COALESCE(NEW.adjustment_date, CURRENT_DATE),
      CASE
        WHEN NEW.adjustment_type ILIKE '%opening%' THEN 'opening'
        WHEN COALESCE(NEW.adjustment_kg, 0) >= 0 THEN 'adjustment_in'
        ELSE 'adjustment_out'
      END,
      COALESCE(NEW.ingredient_name, ''),
      ABS(COALESCE(NEW.adjustment_kg, 0)),
      NEW.unit,
      NEW.rate,
      NEW.remarks,
      NEW.id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger SET
      txn_date   = COALESCE(NEW.adjustment_date, CURRENT_DATE),
      txn_type   = CASE
                     WHEN NEW.adjustment_type ILIKE '%opening%' THEN 'opening'
                     WHEN COALESCE(NEW.adjustment_kg, 0) >= 0 THEN 'adjustment_in'
                     ELSE 'adjustment_out'
                   END,
      item_name  = COALESCE(NEW.ingredient_name, ''),
      qty        = ABS(COALESCE(NEW.adjustment_kg, 0)),
      unit       = NEW.unit,
      unit_price = NEW.rate,
      remarks    = NEW.remarks
    WHERE adj_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger WHERE adj_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_adj_to_stock_ledger error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_adj_stock_ledger ON public.feed_stock_adjustments;
CREATE TRIGGER trg_adj_stock_ledger
  AFTER INSERT OR UPDATE OR DELETE ON public.feed_stock_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.fn_adj_to_stock_ledger();

-- ── Step 5: Backfill existing adjustments ────────────────────────────────────
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_name, qty, unit, unit_price, remarks, adj_id)
SELECT
  COALESCE(a.adjustment_date, CURRENT_DATE),
  CASE
    WHEN a.adjustment_type ILIKE '%opening%' THEN 'opening'
    WHEN COALESCE(a.adjustment_kg, 0) >= 0 THEN 'adjustment_in'
    ELSE 'adjustment_out'
  END,
  COALESCE(a.ingredient_name, ''),
  ABS(COALESCE(a.adjustment_kg, 0)),
  a.unit,
  a.rate,
  a.remarks,
  a.id
FROM public.feed_stock_adjustments a
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.adj_id = a.id
);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT txn_type, COUNT(*) AS rows FROM public.stock_ledger GROUP BY txn_type ORDER BY txn_type;
