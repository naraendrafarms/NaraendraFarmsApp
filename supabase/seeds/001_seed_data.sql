SET session_replication_role = replica;

-- ============================================================
-- NARAENDRA FARMS — CLEAN SEED DATA v4.0
-- No dollar-quoted blocks, simple plain SQL
-- ============================================================

INSERT INTO public.farms (code,name,site_type,address,taluka,district,state,elec_usc_1,is_active) VALUES
  ('KPALLY',  'Kethireddypally',         'rearing',  'Kethireddypally Village',     'Miryalaguda','Nalgonda', 'Telangana','103770721',true),
  ('PPALLY',  'Agraharam Potlapally',    'laying',   'Agraharam, Potlapally',        'Miryalaguda','Nalgonda', 'Telangana','108508370',true),
  ('BPET1',   'Bodjanampet - 1',         'laying',   'Bodjanampet Village',          'Miryalaguda','Nalgonda', 'Telangana','103770716',true),
  ('BPET2',   'Bodjanampet - 2 (VHL)',   'laying',   'Bodjanampet Village',          'Miryalaguda','Nalgonda', 'Telangana','103770715',true),
  ('FEEDMILL','Feed Mill',               'feedmill', 'Feed Mill - Naraendra Farms',  'Miryalaguda','Nalgonda', 'Telangana','112870608',true),
  ('HO',      'Head Office',             'office',   'Head Office - Naraendra Farms','Hyderabad',  'Hyderabad','Telangana',NULL,       true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name;

-- ── SHEDS — from Naraendra_Farms_Shed_Capacity_Site_Wise.xlsx ──────
-- KPALLY: Brooding & Growing rearing farm, 12 sheds (combined sex)
-- PPALLY: Laying farm, 4 sheds each (female+male stored together)
-- BPET1:  Laying farm, 7 sheds each (female+male stored together)
-- BPET2:  Laying farm, 4 sheds each (female+male stored together)
INSERT INTO public.sheds
  (farm_id, shed_no, shed_name, shed_type, sex,
   a_side_boxes, b_side_boxes, total_boxes,
   capacity_female, capacity_male, birds_per_box, water_tank_litres)
SELECT f.id, v.sno, v.sname, v.stype::text, v.sex::text,
       v.abox, v.bbox, v.tbox,
       v.capf, v.capm, v.bpb, v.wtank
FROM public.farms f
JOIN (VALUES
  -- KPALLY: sheds 1-4 grower (2 birds/box), 5-6 brooding (6 birds/box), 7-9 grower, 10-12 brooding
  ('KPALLY','1', 'Shed 1',  'grower',  'combined', NULL,NULL,2304, 4608,NULL,2.0,500),
  ('KPALLY','2', 'Shed 2',  'grower',  'combined', NULL,NULL,2288, 4576,NULL,2.0,500),
  ('KPALLY','3', 'Shed 3',  'grower',  'combined', NULL,NULL,2304, 4608,NULL,2.0,500),
  ('KPALLY','4', 'Shed 4',  'grower',  'combined', NULL,NULL,2288, 4576,NULL,2.0,500),
  ('KPALLY','5', 'Shed 5',  'brooding','combined', 528, 564, 1092, 6552,NULL,6.0,500),
  ('KPALLY','6', 'Shed 6',  'brooding','combined', 770, 518, 1288, 7728,NULL,6.0,500),
  ('KPALLY','7', 'Shed 7',  'grower',  'combined', 1344,1344,2688, 5376,NULL,2.0,500),
  ('KPALLY','8', 'Shed 8',  'grower',  'combined', 1344,1344,2688, 5376,NULL,2.0,500),
  ('KPALLY','9', 'Shed 9',  'grower',  'combined', 1328,1344,2672, 5344,NULL,2.0,500),
  ('KPALLY','10','Shed 10', 'brooding','combined', 864, 928, 1792,10752,NULL,6.0,1000),
  ('KPALLY','11','Shed 11', 'brooding','combined', 480, 840, 1320, 7920,NULL,6.0,500),
  ('KPALLY','12','Shed 12', 'brooding','combined', 480, 840, 1320, 7920,NULL,6.0,500),
  -- PPALLY (Agraharam Potlapally): 4 laying sheds, female+male in same shed
  ('PPALLY','1', 'Shed 1',  'laying',  'combined', NULL,NULL,5533,11066,1256,2.0,2000),
  ('PPALLY','2', 'Shed 2',  'laying',  'combined', NULL,NULL,5470,10940,1340,2.0,2000),
  ('PPALLY','3', 'Shed 3',  'laying',  'combined', 2852,2696,5548,11096,1344,2.0,2000),
  ('PPALLY','4', 'Shed 4',  'laying',  'combined', 2848,2696,5544,11088,1344,2.0,2000),
  -- BPET1 (Bodjanampet-1): 7 laying sheds
  ('BPET1','1',  'Shed 1',  'laying',  'combined', 1960,940, 2900, 5800, 704, 2.0,2000),
  ('BPET1','2',  'Shed 2',  'laying',  'combined', 1442,1442,2884, 5768, 704, 2.0,2000),
  ('BPET1','3',  'Shed 3',  'laying',  'combined', 1442,1442,2884, 5768, 704, 2.0,2000),
  ('BPET1','4',  'Shed 4',  'laying',  'combined', 1446,1448,2894, 5788, 704, 2.0,2000),
  ('BPET1','5',  'Shed 5',  'laying',  'combined', NULL,NULL,1914, 3828, 388, 2.0,1000),
  ('BPET1','6',  'Shed 6',  'laying',  'combined', NULL,NULL,2032, 4064, 408, 2.0,1000),
  ('BPET1','7',  'Shed 7',  'laying',  'combined', NULL,NULL,2032, 4064, 408, 2.0,1000),
  -- BPET2 (Bodjanampet-2 VHL): 4 laying sheds
  ('BPET2','1',  'Shed 1',  'laying',  'combined', 1394,1306,2700, 5400, 560, 2.0,2000),
  ('BPET2','2',  'Shed 2',  'laying',  'combined', 1398,1324,2722, 5444, 532, 2.0,2000),
  ('BPET2','3',  'Shed 3',  'laying',  'combined', 1398,1328,2726, 5452, 528, 2.0,2000),
  ('BPET2','4',  'Shed 4',  'laying',  'combined', 1400,1328,2728, 5456, 528, 2.0,2000)
) v(fc,sno,sname,stype,sex,abox,bbox,tbox,capf,capm,bpb,wtank)
  ON f.code=v.fc
ON CONFLICT (farm_id,shed_no) DO UPDATE
  SET shed_name=EXCLUDED.shed_name, shed_type=EXCLUDED.shed_type, sex=EXCLUDED.sex,
      a_side_boxes=EXCLUDED.a_side_boxes, b_side_boxes=EXCLUDED.b_side_boxes,
      total_boxes=EXCLUDED.total_boxes, capacity_female=EXCLUDED.capacity_female,
      capacity_male=EXCLUDED.capacity_male, birds_per_box=EXCLUDED.birds_per_box,
      water_tank_litres=EXCLUDED.water_tank_litres;

INSERT INTO public.hatcheries (name) VALUES
  ('Ruiya GF'),
  ('Ruiya TF'),
  ('Howrah'),
  ('Venkateswara'),
  ('Sai Chicks'),
  ('Sri Ranga'),
  ('Balaji Hatchery'),
  ('Tirumala'),
  ('Sri Sai'),
  ('Lakshmi'),
  ('Padmavathi'),
  ('Aditya')
ON CONFLICT DO NOTHING;

INSERT INTO public.parties (name,type) VALUES
  ('Ruiya Group','buyer'),
  ('Howrah Hatcheries','buyer'),
  ('Venkateswara Hatcheries','buyer'),
  ('Sai Poultry','buyer'),
  ('Sri Ranga Hatcheries','buyer'),
  ('Local Market','buyer'),
  ('Wholesale Buyer 1','buyer'),
  ('Wholesale Buyer 2','buyer'),
  ('Srinivasa Agencies','supplier'),
  ('Laxmi Agencies','supplier'),
  ('Sri Sai Traders','supplier'),
  ('Venkat Agencies','supplier'),
  ('Hyderabad Feed Co','supplier'),
  ('Andhra Maize Suppliers','supplier'),
  ('Telangana Soya Corp','supplier'),
  ('Nalgonda Lime Works','supplier'),
  ('KV Gas Agency','supplier'),
  ('Sri Balaji Gas','supplier'),
  ('Poultech Pharma','supplier'),
  ('Venkatesh Pharma','supplier'),
  ('Shree Pharma','supplier'),
  ('Bio Labs Hyderabad','supplier'),
  ('AP Chemicals','supplier'),
  ('Kisan Fertilizers','supplier')
ON CONFLICT DO NOTHING;

INSERT INTO public.electricity_meters (farm_id,usc_no,meter_name)
SELECT f.id,v.usc,v.nm FROM public.farms f
JOIN (VALUES
  ('KPALLY','103770721','Kethireddypally Main'),
  ('PPALLY','108508370','Potlapally Main'),
  ('BPET1','103770716','Bodjanampet-1 Main'),
  ('BPET2','103770715','Bodjanampet-2 Main'),
  ('FEEDMILL','112870608','Feed Mill Main'),
  ('PPALLY','114422322','Potlapally-2'),
  ('PPALLY','114422323','Potlapally-3')
) v(fc,usc,nm) ON f.code=v.fc
ON CONFLICT (usc_no) DO NOTHING;

INSERT INTO public.feed_ingredients (code,name,unit) VALUES
  ('MAIZE','Maize','kg'),
  ('DORB','De-Oiled Rice Bran','kg'),
  ('SOYA','Soya DOC','kg'),
  ('LIMST','Limestone Powder','kg'),
  ('MCP','Mono Calcium Phosphate','kg'),
  ('SALT','Common Salt','kg'),
  ('SODA','Sodium Bicarbonate','kg'),
  ('VITMIX','Vitamin Mineral Mix','kg'),
  ('LYSINE','Lysine','kg'),
  ('METHIONINE','DL-Methionine','kg'),
  ('THREONINE','Threonine','kg'),
  ('CHOLINE','Choline Chloride','kg'),
  ('TOXIN','Toxin Binder','kg'),
  ('ENZYME','Enzyme Premix','kg'),
  ('COCCIDIO','Coccidiostat','kg'),
  ('ANTIOXIDANT','Antioxidant','kg'),
  ('PROBIO','Probiotic','kg')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.feed_types (code,name,sort_order) VALUES
  ('BCM','Broiler Chick Mash',1),
  ('BGM','Broiler Grower Mash',2),
  ('BDM','Broiler Developer Mash',3),
  ('PBM','Pre-Breeder Mash',4),
  ('L1','Layer-1 / Breeder Layer',5),
  ('L2','Layer-2',6),
  ('L3','Layer-3',7),
  ('L4','Layer-4',8),
  ('L5','Layer-5',9)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.medicines_master (name,unit,rate,is_active) VALUES
  ('Marek Disease Vaccine','dose',0.5,true),
  ('Newcastle Disease Vaccine','dose',0.4,true),
  ('Infectious Bronchitis Vaccine','dose',0.35,true),
  ('Gumboro Vaccine','dose',0.45,true),
  ('Fowl Pox Vaccine','dose',0.3,true),
  ('Infectious Coryza Vaccine','dose',1.2,true),
  ('AE Vaccine','dose',0.8,true),
  ('EDS Vaccine','dose',0.9,true),
  ('Multi-component Vaccine','dose',1.5,true),
  ('Amprolium','ml',0.08,true),
  ('Oxytetracycline Powder','gm',0.12,true),
  ('Enrofloxacin Solution','ml',0.15,true),
  ('Amoxicillin Powder','gm',0.18,true),
  ('Tylosin Tartrate','gm',0.25,true),
  ('Doxycycline HCl','gm',0.2,true),
  ('Vitamin AD3E','ml',0.1,true),
  ('Vitamin B Complex','gm',0.08,true),
  ('Multivitamin + Electrolytes','gm',0.12,true),
  ('Liver Tonic','ml',0.09,true),
  ('Calcium Borogluconate','ml',0.06,true),
  ('Electrolyte Powder','gm',0.05,true),
  ('Organic Acids','ml',0.07,true),
  ('Probiotic Powder','gm',0.15,true),
  ('Enzyme Supplement','gm',0.18,true),
  ('Antistress Formula','gm',0.1,true),
  ('Calcium Supplement','gm',0.04,true),
  ('Growth Promoter','gm',0.2,true),
  ('Vitamin K','ml',0.08,true),
  ('Ivermectin','ml',0.12,true),
  ('Disinfectant Virkon','gm',0.15,true),
  ('Phenyl Disinfectant','ml',0.05,true),
  ('Fumigation Chemical','gm',0.08,true),
  ('Formalin','ml',0.03,true),
  ('Lime Powder','kg',0.02,true),
  ('Copper Sulphate','gm',0.06,true),
  ('Potassium Permanganate','gm',0.05,true),
  ('Hydrogen Peroxide','ml',0.04,true),
  ('Biofence','ltr',0.35,true),
  ('Foot Bath Chemical','kg',0.18,true),
  ('Rat Poison Bait','gm',0.12,true)
ON CONFLICT DO NOTHING;

-- FLOCKS (4 flocks)
INSERT INTO public.flocks
  (flock_no, breed, status, placement_date, laying_start_date, close_date,
   rearing_farm_id, laying_farm_id,
   paid_female, paid_male, free_female, free_male, chick_rate)
SELECT
  v.fno, 'VENCO-430', v.st, v.pd::date, v.ls::date, v.cd,
  (SELECT id FROM public.farms WHERE code=v.rc),
  (SELECT id FROM public.farms WHERE code=v.lc),
  v.pf, v.pm, v.ff, v.fm, v.cr::numeric
FROM (VALUES
  ('16','closed', '2023-11-24','2024-04-01','2025-04-23'::date,'KPALLY','PPALLY',44860,5391,900,100,12.50),
  ('17','closed', '2024-03-30','2024-09-01','2025-08-01'::date,'KPALLY','BPET1', 36120,4330,800,100,12.50),
  ('18','closed', '2024-05-15','2024-11-01','2025-09-30'::date,'KPALLY','BPET2', 20400,2448,400, 52,12.50),
  ('19','laying', '2025-02-16','2025-09-01',NULL::date,        'KPALLY','PPALLY',44800,5390,900,100,13.00),
  ('20','laying', '2025-05-30','2025-12-01',NULL::date,        'KPALLY','BPET1', 36020,4330,900,100,13.00),
  ('21','laying', '2025-04-10','2025-10-01',NULL::date,        'KPALLY','BPET2', 20400,2448,400, 52,13.00),
  ('22','rearing','2025-09-01',NULL,         NULL::date,        'KPALLY','PPALLY',44800,5390,900,100,13.50)
) v(fno,st,pd,ls,cd,rc,lc,pf,pm,ff,fm,cr)
ON CONFLICT (flock_no) DO UPDATE SET
  status=EXCLUDED.status,
  close_date=EXCLUDED.close_date,
  rearing_farm_id=EXCLUDED.rearing_farm_id,
  laying_farm_id=EXCLUDED.laying_farm_id;




SET session_replication_role = DEFAULT;
