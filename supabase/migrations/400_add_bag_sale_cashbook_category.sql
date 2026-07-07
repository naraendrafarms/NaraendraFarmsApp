-- Migration 400: add a dedicated "Empty Bag Sale" Cash Book category —
-- previously Empty Bags sales posted under the generic 'other' category,
-- indistinguishable from any other miscellaneous receipt.

INSERT INTO public.config_options (grp, value, label, sort_order, is_active) VALUES
  ('cashbook_category', 'bag_sale', 'Empty Bag Sale', 7, TRUE)
ON CONFLICT (grp, value) DO UPDATE SET label = EXCLUDED.label, is_active = TRUE;

SELECT value, label, sort_order FROM config_options WHERE grp = 'cashbook_category' ORDER BY sort_order;
