-- Unified purchase item picker across feed + medicine + general (equipment/other)
-- One combined searchable list for the new Purchases entry screen.
-- Existing masters stay the source of truth; this view only unifies them.

CREATE TABLE IF NOT EXISTS public.general_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Equipment',
  unit       TEXT DEFAULT 'Nos',
  hsn_code   TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP VIEW IF EXISTS public.v_purchase_items;
CREATE VIEW public.v_purchase_items AS
  SELECT id,
         name,
         COALESCE(short_name, name) AS short_name,
         'Feed'              AS purchase_category,
         COALESCE(unit, 'kg') AS unit,
         'feed_ingredients'  AS source_table
  FROM public.feed_ingredients
  WHERE is_active
  UNION ALL
  SELECT id,
         name,
         name                AS short_name,
         'Medicine'          AS purchase_category,
         COALESCE(unit, 'ml') AS unit,
         'medicines_master'  AS source_table
  FROM public.medicines_master
  WHERE is_active
  UNION ALL
  SELECT id,
         name,
         name                AS short_name,
         category            AS purchase_category,
         COALESCE(unit, 'Nos') AS unit,
         'general_items'     AS source_table
  FROM public.general_items
  WHERE is_active;
