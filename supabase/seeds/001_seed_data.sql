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

INSERT INTO public.sheds (farm_id,shed_name,shed_no,capacity_birds)
SELECT f.id,v.sn,v.sno,v.cap FROM public.farms f
JOIN (VALUES
  ('KPALLY','Shed A','A',22000),
  ('KPALLY','Shed B','B',22000),
  ('KPALLY','Shed C','C',22000),
  ('KPALLY','Shed D','D',10000),
  ('KPALLY','Shed E','E',10000),
  ('KPALLY','Shed F','F',9000),
  ('PPALLY','Shed 1','1',16000),
  ('PPALLY','Shed 2','2',16000),
  ('PPALLY','Shed 3','3',16000),
  ('PPALLY','Shed 4','4',9000),
  ('PPALLY','Shed 5','5',9000),
  ('BPET1','Shed 1','1',14000),
  ('BPET1','Shed 2','2',14000),
  ('BPET1','Shed 3','3',14000),
  ('BPET2','Shed 1','1',14000),
  ('BPET2','Shed 2','2',14000),
  ('FEEDMILL','Store A','A',5000)
) v(fc,sn,sno,cap) ON f.code=v.fc
ON CONFLICT DO NOTHING;

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
  (flock_no,status,placement_date,laying_start_date,depletion_date,
   rearing_farm_id,laying_farm_id,total_placed_f,total_placed_m,
   paid_female,paid_male,free_female,free_male,transit_mortality,
   breed,chick_rate,chick_cost)
VALUES
  ('16','closed','2023-11-24'::date,'2024-04-01'::date,'2025-04-23'::date,
   (SELECT id FROM public.farms WHERE code='KPALLY'),
   (SELECT id FROM public.farms WHERE code='PPALLY'),
   45760,5491,44860,5391,900,100,200,'VENCO-430',12.50,617835.00),
  ('17','closed','2024-03-30'::date,'2024-09-01'::date,'2025-08-01'::date,
   (SELECT id FROM public.farms WHERE code='KPALLY'),
   (SELECT id FROM public.farms WHERE code='BPET1'),
   36920,4430,36120,4330,800,100,200,'VENCO-430',12.50,516970.00),
  ('19','laying','2025-02-16'::date,'2025-09-01'::date,NULL,
   (SELECT id FROM public.farms WHERE code='KPALLY'),
   (SELECT id FROM public.farms WHERE code='PPALLY'),
   45700,5490,44800,5390,900,100,200,'VENCO-430',13.00,669770.00),
  ('20','laying','2025-05-30'::date,'2025-12-01'::date,NULL,
   (SELECT id FROM public.farms WHERE code='KPALLY'),
   (SELECT id FROM public.farms WHERE code='BPET1'),
   36920,4430,36020,4330,900,100,200,'VENCO-430',13.00,536380.00)
ON CONFLICT (flock_no) DO UPDATE SET
  status=EXCLUDED.status,
  depletion_date=EXCLUDED.depletion_date,
  rearing_farm_id=EXCLUDED.rearing_farm_id,
  laying_farm_id=EXCLUDED.laying_farm_id;
