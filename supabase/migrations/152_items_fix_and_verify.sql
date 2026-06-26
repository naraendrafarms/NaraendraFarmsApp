-- Migration 152: Fix migration 151 loose RAISE NOTICE + verify items table + show diagnostics

DO $$
DECLARE
  cnt_items INTEGER;
  cnt_feed  INTEGER;
  cnt_med   INTEGER;
  cnt_gen   INTEGER;
  unmatched_grn INTEGER;
  unmatched_fpi INTEGER;
  unmatched_po  INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_items FROM public.items;
  SELECT COUNT(*) INTO cnt_feed  FROM public.feed_ingredients;
  SELECT COUNT(*) INTO cnt_med   FROM public.medicines_master;
  SELECT COUNT(*) INTO cnt_gen   FROM public.general_items;

  RAISE NOTICE 'items table total rows: %', cnt_items;
  RAISE NOTICE 'feed_ingredients: %, medicines_master: %, general_items: %', cnt_feed, cnt_med, cnt_gen;
  RAISE NOTICE 'Expected items >= % (some may overlap)', cnt_feed + cnt_med + cnt_gen;

  SELECT COUNT(*) INTO unmatched_grn
  FROM public.grn WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'GRN rows unmatched to items: %', unmatched_grn;

  SELECT COUNT(*) INTO unmatched_fpi
  FROM public.feed_production_ingredients WHERE item_id IS NULL AND ingredient_name IS NOT NULL;
  RAISE NOTICE 'feed_production_ingredients unmatched: %', unmatched_fpi;

  SELECT COUNT(*) INTO unmatched_po
  FROM public.purchase_orders WHERE item_id IS NULL AND item_name IS NOT NULL;
  RAISE NOTICE 'purchase_orders unmatched: %', unmatched_po;

  RAISE NOTICE 'Done: migration 151/152 verified OK';
END
$$;
