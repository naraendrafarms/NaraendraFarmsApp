-- Retry of 704, whose constraint listing failed: contype is a "char" column
-- and concatenating it needs an explicit cast, which Postgres refused to guess.
-- Same checks otherwise, still self-reverting.

-- Diagnostic only, and self-reverting. The trigger swallows its own errors, so
-- the actual database message has never been seen. This performs the exact
-- insert the trigger would perform for ONE failing ingredient line, captures
-- what happens, and removes the row again if it succeeded -- so stock is
-- unchanged either way.

CREATE TABLE IF NOT EXISTS public._diag_feedmill (note text, created_at timestamptz DEFAULT now());
DELETE FROM public._diag_feedmill;

-- Constraints and indexes on stock_ledger, asked separately because this is the
-- statement that failed last time.
INSERT INTO public._diag_feedmill (note)
SELECT 'CONSTRAINTS: ' || COALESCE(string_agg(conname || '/' || contype::text, ', '), 'none')
FROM pg_constraint WHERE conrelid = 'public.stock_ledger'::regclass;

INSERT INTO public._diag_feedmill (note)
SELECT 'INDEXES: ' || COALESCE(string_agg(indexname, ', '), 'none')
FROM pg_indexes WHERE schemaname='public' AND tablename='stock_ledger';

INSERT INTO public._diag_feedmill (note)
SELECT 'NOT NULL COLS: ' || COALESCE(string_agg(column_name, ', '), 'none')
FROM information_schema.columns
WHERE table_schema='public' AND table_name='stock_ledger' AND is_nullable='NO';

-- The live test.
DO $$
DECLARE
  v_line   record;
  v_date   date;
  v_farm   uuid;
  v_item   uuid;
  v_new_id uuid;
BEGIN
  SELECT i.* INTO v_line
  FROM public.feed_production_ingredients i
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_ledger s
    WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
      AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,'')))
  LIMIT 1;

  IF v_line IS NULL THEN
    INSERT INTO public._diag_feedmill (note) VALUES ('NO MISSING LINES FOUND');
    RETURN;
  END IF;

  SELECT production_date, farm_id INTO v_date, v_farm
  FROM public.feed_production_log WHERE id = v_line.production_id;

  SELECT id INTO v_item FROM public.items
  WHERE lower(name) = lower(COALESCE(v_line.ingredient_name,'')) LIMIT 1;

  INSERT INTO public._diag_feedmill (note) VALUES (
    'TESTING line for ingredient=' || COALESCE(v_line.ingredient_name,'?')
    || ' qty=' || COALESCE(v_line.quantity_kg::text,'null')
    || ' prod_date=' || COALESCE(v_date::text,'null')
    || ' farm=' || COALESCE(v_farm::text,'null')
    || ' item_id=' || COALESCE(v_item::text,'NOT FOUND'));

  BEGIN
    INSERT INTO public.stock_ledger(txn_date, txn_type, item_id, item_name, qty, unit, feed_prod_id, farm_id)
    VALUES (COALESCE(v_date, CURRENT_DATE), 'production_out', v_item,
            COALESCE(v_line.ingredient_name,''), COALESCE(v_line.quantity_kg,0), 'kg',
            v_line.production_id, v_farm)
    RETURNING id INTO v_new_id;

    INSERT INTO public._diag_feedmill (note) VALUES ('INSERT SUCCEEDED — so the row CAN be written; removing it again');
    DELETE FROM public.stock_ledger WHERE id = v_new_id;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._diag_feedmill (note) VALUES ('INSERT FAILED: ' || SQLERRM);
  END;
END;
$$;

SELECT COALESCE(string_agg(note, '  ||  ' ORDER BY created_at, note), 'NOTHING CAPTURED') AS findings
FROM public._diag_feedmill;

DROP TABLE IF EXISTS public._diag_feedmill;
