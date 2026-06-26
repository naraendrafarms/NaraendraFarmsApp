-- Migration 155: Add Chicks to item_category config_options
INSERT INTO public.config_options (grp, value, label, sort_order, is_active)
VALUES ('item_category', 'Chicks', 'Chicks', 14, TRUE)
ON CONFLICT (grp, value) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Done: Chicks added to item_category config_options';
END;
$$;
