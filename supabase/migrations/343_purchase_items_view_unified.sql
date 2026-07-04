-- v_purchase_items was still built as a UNION over the legacy
-- feed_ingredients/medicines_master/general_items tables. Purchase Entry's
-- "+ Add new item" also still inserted into those same legacy tables
-- (fixed in the same commit as this migration) rather than the unified
-- `items` table added by migration 151 - so any item added through that
-- flow since the unification never appeared in Items Master, GRN, or
-- Inventory, and any item added via those unified screens never appeared
-- in Purchase Entry's picker. Rebuild the view directly off `items`.
DROP VIEW IF EXISTS public.v_purchase_items;
CREATE VIEW public.v_purchase_items AS
  SELECT id,
         name,
         COALESCE(short_name, name) AS short_name,
         CASE category
           WHEN 'Feed Ingredient' THEN 'Feed'
           WHEN 'Medicine'        THEN 'Medicine'
           WHEN 'Equipment'       THEN 'Equipment'
           ELSE                        'Other'
         END AS purchase_category,
         COALESCE(unit, 'Nos') AS unit,
         'items' AS source_table
  FROM public.items
  WHERE is_active;
