-- Migration 154: Stock Ledger (append-only movements table)
-- Sources: GRN (IN), feed_production (OUT for ingredients), medicine_usage (OUT),
--          manual adjustments (IN/OUT), transfers between sites.

CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_date        DATE NOT NULL,
  txn_type        TEXT NOT NULL, -- 'grn_in','production_out','medicine_out','adjustment_in','adjustment_out','transfer_out','transfer_in','opening'
  item_id         UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  qty             NUMERIC(12,3) NOT NULL,  -- always positive
  unit            TEXT,
  unit_price      NUMERIC(12,2),
  total_value     NUMERIC(14,2),
  grn_id          UUID REFERENCES public.grn(id) ON DELETE SET NULL,
  feed_prod_id    UUID REFERENCES public.feed_production_log(id) ON DELETE SET NULL,
  med_usage_id    UUID REFERENCES public.medicine_usage(id) ON DELETE SET NULL,
  flock_id        UUID REFERENCES public.flocks(id) ON DELETE SET NULL,
  farm_id         UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  reference_no    TEXT,
  remarks         TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_item_date  ON public.stock_ledger(item_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_sl_txn_type   ON public.stock_ledger(txn_type);
CREATE INDEX IF NOT EXISTS idx_sl_grn_id     ON public.stock_ledger(grn_id) WHERE grn_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sl_feed_prod  ON public.stock_ledger(feed_prod_id) WHERE feed_prod_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sl_med_usage  ON public.stock_ledger(med_usage_id) WHERE med_usage_id IS NOT NULL;

-- ── GRN trigger: auto IN entry ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_grn_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stock_ledger(
      txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
      grn_id, farm_id, reference_no, remarks)
    VALUES(
      COALESCE(NEW.grn_date, CURRENT_DATE),
      'grn_in',
      NEW.item_id,
      COALESCE(NEW.item_name, ''),
      COALESCE(NEW.quantity, 0),
      NEW.unit,
      NEW.unit_price,
      COALESCE(NEW.total_amount, (NEW.quantity * NEW.unit_price)),
      NEW.id,
      NEW.farm_id,
      NEW.grn_no,
      NEW.remarks
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger SET
      txn_date   = COALESCE(NEW.grn_date, CURRENT_DATE),
      item_id    = NEW.item_id,
      item_name  = COALESCE(NEW.item_name, ''),
      qty        = COALESCE(NEW.quantity, 0),
      unit       = NEW.unit,
      unit_price = NEW.unit_price,
      total_value= COALESCE(NEW.total_amount, (NEW.quantity * NEW.unit_price)),
      reference_no = NEW.grn_no,
      remarks    = NEW.remarks,
      farm_id    = NEW.farm_id
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

DROP TRIGGER IF EXISTS trg_grn_stock_ledger ON public.grn;
CREATE TRIGGER trg_grn_stock_ledger
  AFTER INSERT OR UPDATE OR DELETE ON public.grn
  FOR EACH ROW EXECUTE FUNCTION public.fn_grn_to_stock_ledger();

-- ── Feed Production trigger: auto OUT for each ingredient ────────────────────
-- feed_production_ingredients drives the OUT; one row per ingredient per batch
CREATE OR REPLACE FUNCTION public.fn_feed_prod_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE
  v_prod_date DATE;
  v_farm_id   UUID;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT production_date, farm_id
      INTO v_prod_date, v_farm_id
      FROM public.feed_production_log WHERE id = NEW.production_id;

    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.stock_ledger(
        txn_date, txn_type, item_id, item_name, qty, unit,
        feed_prod_id, farm_id)
      VALUES(
        COALESCE(v_prod_date, CURRENT_DATE),
        'production_out',
        NEW.item_id,
        COALESCE(NEW.ingredient_name, ''),
        COALESCE(NEW.quantity_kg, 0),
        'kg',
        NEW.production_id,
        v_farm_id
      );
    ELSIF TG_OP = 'UPDATE' THEN
      UPDATE public.stock_ledger SET
        txn_date  = COALESCE(v_prod_date, CURRENT_DATE),
        item_id   = NEW.item_id,
        item_name = COALESCE(NEW.ingredient_name, ''),
        qty       = COALESCE(NEW.quantity_kg, 0),
        farm_id   = v_farm_id
      WHERE feed_prod_id = NEW.production_id
        AND txn_type = 'production_out'
        AND item_name = OLD.ingredient_name;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger
    WHERE feed_prod_id = OLD.production_id
      AND txn_type = 'production_out'
      AND item_name = OLD.ingredient_name;
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_feed_prod_to_stock_ledger error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_prod_stock_ledger ON public.feed_production_ingredients;
CREATE TRIGGER trg_feed_prod_stock_ledger
  AFTER INSERT OR UPDATE OR DELETE ON public.feed_production_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_prod_to_stock_ledger();

-- ── Medicine Usage trigger: auto OUT ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_med_usage_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stock_ledger(
      txn_date, txn_type, item_id, item_name, qty, unit,
      med_usage_id, flock_id, remarks)
    VALUES(
      COALESCE(NEW.usage_date, CURRENT_DATE),
      'medicine_out',
      NEW.item_id,
      COALESCE((SELECT name FROM public.items WHERE id = NEW.item_id), ''),
      COALESCE(NEW.quantity, 0),
      NEW.unit,
      NEW.id,
      NEW.flock_id,
      NEW.remarks
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger SET
      txn_date    = COALESCE(NEW.usage_date, CURRENT_DATE),
      item_id     = NEW.item_id,
      item_name   = COALESCE((SELECT name FROM public.items WHERE id = NEW.item_id), ''),
      qty         = COALESCE(NEW.quantity, 0),
      unit        = NEW.unit,
      flock_id    = NEW.flock_id,
      remarks     = NEW.remarks
    WHERE med_usage_id = NEW.id AND txn_type = 'medicine_out';
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.stock_ledger WHERE med_usage_id = OLD.id AND txn_type = 'medicine_out';
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_med_usage_to_stock_ledger error: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_med_usage_stock_ledger ON public.medicine_usage;
CREATE TRIGGER trg_med_usage_stock_ledger
  AFTER INSERT OR UPDATE OR DELETE ON public.medicine_usage
  FOR EACH ROW EXECUTE FUNCTION public.fn_med_usage_to_stock_ledger();

-- ── Backfill from existing GRN rows ──────────────────────────────────────────
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit, unit_price, total_value,
  grn_id, farm_id, reference_no, remarks)
SELECT
  COALESCE(g.grn_date, g.created_at::DATE, CURRENT_DATE),
  'grn_in',
  g.item_id,
  COALESCE(g.item_name, ''),
  COALESCE(g.quantity, 0),
  g.unit,
  g.unit_price,
  COALESCE(g.total_amount, (g.quantity * g.unit_price)),
  g.id,
  g.farm_id,
  g.grn_no,
  g.remarks
FROM public.grn g
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.grn_id = g.id AND sl.txn_type = 'grn_in'
);

-- ── Backfill from feed_production_ingredients ─────────────────────────────────
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit,
  feed_prod_id, farm_id)
SELECT
  COALESCE(fp.production_date, CURRENT_DATE),
  'production_out',
  fpi.item_id,
  COALESCE(fpi.ingredient_name, ''),
  COALESCE(fpi.quantity_kg, 0),
  'kg',
  fp.id,
  fp.farm_id
FROM public.feed_production_ingredients fpi
JOIN public.feed_production_log fp ON fp.id = fpi.production_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl
  WHERE sl.feed_prod_id = fp.id
    AND sl.item_name = fpi.ingredient_name
    AND sl.txn_type = 'production_out'
);

-- ── Backfill from medicine_usage ──────────────────────────────────────────────
INSERT INTO public.stock_ledger(
  txn_date, txn_type, item_id, item_name, qty, unit,
  med_usage_id, flock_id, remarks)
SELECT
  COALESCE(mu.usage_date, CURRENT_DATE),
  'medicine_out',
  mu.item_id,
  COALESCE((SELECT name FROM public.items WHERE id = mu.item_id), ''),
  COALESCE(mu.quantity, 0),
  mu.unit,
  mu.id,
  mu.flock_id,
  mu.remarks
FROM public.medicine_usage mu
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger sl WHERE sl.med_usage_id = mu.id AND sl.txn_type = 'medicine_out'
);

DO $$
DECLARE
  cnt_in  INT;
  cnt_out INT;
BEGIN
  SELECT COUNT(*) INTO cnt_in  FROM public.stock_ledger WHERE txn_type = 'grn_in';
  SELECT COUNT(*) INTO cnt_out FROM public.stock_ledger WHERE txn_type IN ('production_out','medicine_out');
  RAISE NOTICE 'stock_ledger: grn_in=%, outs=%', cnt_in, cnt_out;
END;
$$;
