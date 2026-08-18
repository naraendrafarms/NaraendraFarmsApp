-- Migration 747: editing a feed production deleted its own consumption.
--
-- The consumption trigger keyed every ledger row on the PRODUCTION plus the
-- INGREDIENT NAME, not on the ingredient line itself. The edit path saves in
-- this order: insert the new ingredient rows, then delete the old ones. Each
-- new row wrote its ledger entry correctly — and then the delete of the old
-- row, matching on the same production and the same ingredient name, removed
-- the entry that had just been written. The batch kept its ingredients and
-- lost its consumption, silently, with no error anywhere.
--
-- That is what happened to the batch of 31/05/2026 when it was edited today:
-- 111 ingredient lines totalling 407,265.67 kg, but only 81 consumption rows
-- totalling 322,152.42 kg. 30 lines and about 85,113 kg never came off stock.
--
-- The fix is to tie each ledger row to the ingredient LINE that caused it, so
-- a delete can only ever remove its own row. Then repair 31/05.

ALTER TABLE public.stock_ledger
  ADD COLUMN IF NOT EXISTS prod_ing_id UUID;

CREATE INDEX IF NOT EXISTS idx_sl_prod_ing ON public.stock_ledger(prod_ing_id) WHERE prod_ing_id IS NOT NULL;

-- Tie the ledger rows that already exist to their ingredient line. One row per
-- line, matched on production and name; where a batch lists the same
-- ingredient twice, they pair up in a fixed order rather than at random.
WITH pairs AS (
  SELECT s.id AS sl_id, i.id AS ing_id,
         row_number() OVER (PARTITION BY s.feed_prod_id, lower(s.item_name) ORDER BY s.created_at, s.id) AS s_rn,
         row_number() OVER (PARTITION BY i.production_id, lower(i.ingredient_name) ORDER BY i.id) AS i_rn
  FROM public.stock_ledger s
  JOIN public.feed_production_ingredients i
    ON i.production_id = s.feed_prod_id
   AND lower(i.ingredient_name) = lower(s.item_name)
  WHERE s.txn_type = 'production_out' AND s.prod_ing_id IS NULL
)
UPDATE public.stock_ledger sl SET prod_ing_id = p.ing_id
FROM pairs p WHERE sl.id = p.sl_id AND p.s_rn = p.i_rn;

CREATE OR REPLACE FUNCTION public.fn_feed_prod_to_stock_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
DECLARE
  v_prod_date DATE;
  v_farm_id   UUID;
  v_item_id   UUID;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT production_date, farm_id INTO v_prod_date, v_farm_id
      FROM public.feed_production_log WHERE id = NEW.production_id;

    SELECT id INTO v_item_id FROM public.items
      WHERE lower(name) = lower(COALESCE(NEW.ingredient_name,'')) LIMIT 1;

    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.stock_ledger(
        txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id, prod_ing_id)
      VALUES(
        COALESCE(v_prod_date, CURRENT_DATE), 'production_out', v_item_id,
        COALESCE(NEW.ingredient_name,''), COALESCE(NEW.quantity_kg,0), 'kg',
        NEW.production_id, v_farm_id, NEW.id);
    ELSE
      -- Keyed on the ingredient LINE, so an edit updates its own row and
      -- cannot touch another line that happens to share the name.
      UPDATE public.stock_ledger SET
        txn_date  = COALESCE(v_prod_date, CURRENT_DATE),
        item_id   = v_item_id,
        item_name = COALESCE(NEW.ingredient_name,''),
        qty       = COALESCE(NEW.quantity_kg,0),
        farm_id   = v_farm_id
      WHERE prod_ing_id = NEW.id AND txn_type = 'production_out';

      IF NOT FOUND THEN
        INSERT INTO public.stock_ledger(
          txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id, prod_ing_id)
        VALUES(
          COALESCE(v_prod_date, CURRENT_DATE), 'production_out', v_item_id,
          COALESCE(NEW.ingredient_name,''), COALESCE(NEW.quantity_kg,0), 'kg',
          NEW.production_id, v_farm_id, NEW.id);
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only this line's own row. Matching on production plus name is what let a
    -- delete take out a row another line had just written.
    DELETE FROM public.stock_ledger
    WHERE txn_type = 'production_out'
      AND (prod_ing_id = OLD.id
           OR (prod_ing_id IS NULL AND feed_prod_id = OLD.production_id
               AND item_name = OLD.ingredient_name));
  END IF;

  RETURN COALESCE(NEW, OLD);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Stock could not be updated for ingredient "%" on this production (%). The production was NOT saved. Tell the office: %',
    COALESCE(NEW.ingredient_name, OLD.ingredient_name, '?'),
    COALESCE(NEW.production_id, OLD.production_id), SQLERRM;
END;
$$;

-- Repair 31/05/2026: write the consumption for every ingredient line that has
-- none, dated to the production itself and marked so it can be told apart.
INSERT INTO public.stock_ledger (txn_date, txn_type, item_id, item_name, qty, unit,
                                 feed_prod_id, prod_ing_id, farm_id, remarks)
SELECT COALESCE(l.production_date, CURRENT_DATE), 'production_out',
       (SELECT it.id FROM public.items it WHERE lower(it.name) = lower(COALESCE(i.ingredient_name,'')) LIMIT 1),
       COALESCE(i.ingredient_name,''), COALESCE(i.quantity_kg,0), 'kg',
       i.production_id, i.id, l.farm_id,
       'Repaired 18/08/2026 — consumption deleted by an edit of this batch'
FROM public.feed_production_ingredients i
JOIN public.feed_production_log l ON l.id = i.production_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_ledger s
  WHERE s.txn_type = 'production_out'
    AND (s.prod_ing_id = i.id
         OR (s.feed_prod_id = i.production_id AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,''))))
);

NOTIFY pgrst, 'reload schema';
