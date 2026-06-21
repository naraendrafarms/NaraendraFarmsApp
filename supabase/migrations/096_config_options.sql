-- Migration 096: config_options — a single table for all editable dropdown lists
-- Replaces all hardcoded arrays in entry pages (material types, payment methods, etc.)

CREATE TABLE IF NOT EXISTS public.config_options (
  id         SERIAL PRIMARY KEY,
  grp        TEXT NOT NULL,
  value      TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grp, value)
);

-- Material / purchase types  (used in PO + GRN entry)
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('material_type','Feed Raw Material',1),
  ('material_type','Medicine',2),
  ('material_type','Oral Medicine',3),
  ('material_type','Feed Medicine',4),
  ('material_type','Vaccine',5),
  ('material_type','Larvender',6),
  ('material_type','Feedmill Transport',7),
  ('material_type','Packaging',8),
  ('material_type','Chemical',9),
  ('material_type','Spares',10),
  ('material_type','Other',11)
ON CONFLICT (grp, value) DO NOTHING;

-- Payment / transaction methods
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('payment_method','Online',1),
  ('payment_method','NEFT',2),
  ('payment_method','RTGS',3),
  ('payment_method','IMPS',4),
  ('payment_method','Cheque',5),
  ('payment_method','Cash',6)
ON CONFLICT (grp, value) DO NOTHING;

-- Employee designations
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('designation','Site Incharge',1),
  ('designation','Farm Manager',2),
  ('designation','Computer Operator',3),
  ('designation','Site Supervisor',4),
  ('designation','Farm Worker',5),
  ('designation','Driver',6),
  ('designation','Security',7),
  ('designation','Electrician',8),
  ('designation','Helper',9)
ON CONFLICT (grp, value) DO NOTHING;

-- Bird breeds
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('breed','VENCO-430',1),
  ('breed','VENCO-440',2),
  ('breed','Vencobb-400',3),
  ('breed','Hubbard',4),
  ('breed','Cobb-500',5),
  ('breed','Ross-308',6)
ON CONFLICT (grp, value) DO NOTHING;

-- Feed types used in daily entry
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('feed_type','BCM',1),
  ('feed_type','BGM',2),
  ('feed_type','BDM',3),
  ('feed_type','PBM',4),
  ('feed_type','L1',5),
  ('feed_type','L2',6),
  ('feed_type','L3',7),
  ('feed_type','CHICK',8)
ON CONFLICT (grp, value) DO NOTHING;

-- GRN / Purchase entry categories
INSERT INTO public.config_options (grp, value, sort_order) VALUES
  ('purchase_category','Feed',1),
  ('purchase_category','Medicine',2),
  ('purchase_category','Equipment',3),
  ('purchase_category','Other',4)
ON CONFLICT (grp, value) DO NOTHING;

NOTIFY pgrst, 'reload schema';

SELECT grp, count(*) FROM public.config_options GROUP BY grp ORDER BY grp;
