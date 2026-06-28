-- Migration 220: stock adjustments (opening stock etc.) were posting to stock_ledger
-- WITHOUT item_id, so they showed as a separate name row instead of merging with the
-- Items Master item. Fix the trigger to resolve item_id from items by name, and backfill
-- existing adjustment ledger rows.

CREATE OR REPLACE FUNCTION public.fn_adj_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE v_item_id UUID;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT id INTO v_item_id FROM public.items
      WHERE lower(name) = lower(COALESCE(NEW.ingredient_name,'')) LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stock_ledger(
      txn_date, txn_type, item_id, item_name, qty, unit, unit_price, remarks, adj_id)
    VALUES(
      COALESCE(NEW.adjustment_date, CURRENT_DATE),
      CASE WHEN NEW.adjustment_type ILIKE '%opening%' THEN 'opening'
           WHEN COALESCE(NEW.adjustment_kg, 0) >= 0 THEN 'adjustment_in'
           ELSE 'adjustment_out' END,
      v_item_id,
      COALESCE(NEW.ingredient_name, ''),
      ABS(COALESCE(NEW.adjustment_kg, 0)),
      NEW.unit, NEW.rate, NEW.remarks, NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.stock_ledger SET
      txn_date   = COALESCE(NEW.adjustment_date, CURRENT_DATE),
      txn_type   = CASE WHEN NEW.adjustment_type ILIKE '%opening%' THEN 'opening'
                        WHEN COALESCE(NEW.adjustment_kg, 0) >= 0 THEN 'adjustment_in'
                        ELSE 'adjustment_out' END,
      item_id    = v_item_id,
      item_name  = COALESCE(NEW.ingredient_name, ''),
      qty        = ABS(COALESCE(NEW.adjustment_kg, 0)),
      unit       = NEW.unit, unit_price = NEW.rate, remarks = NEW.remarks
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

-- Backfill item_id on existing adjustment ledger rows
UPDATE public.stock_ledger sl
SET item_id = i.id
FROM public.items i
WHERE sl.adj_id IS NOT NULL AND sl.item_id IS NULL
  AND lower(i.name) = lower(sl.item_name);

SELECT 'after' AS chk,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE adj_id IS NOT NULL) AS adj_rows,
  (SELECT COUNT(*) FROM public.stock_ledger WHERE adj_id IS NOT NULL AND item_id IS NULL) AS still_no_item;
