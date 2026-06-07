-- Electricity meters master
INSERT INTO public.electricity_meters (meter_name, usc_no, service_no, farm_id, load_kw, notes) VALUES
  ('Bodjanampet - 1', '103770716', '381800159', (SELECT id FROM public.farms WHERE code='BPET1'), 80.25, 'Primary connection'),
  ('Potlapally-3', '114422323', '382100397', (SELECT id FROM public.farms WHERE code='BPET1'), 74.25, '2nd connection (from Oct-23)'),
  ('Bodjanampet - 2', '103770715', '381800148', (SELECT id FROM public.farms WHERE code='BPET2'), 102.00, 'Primary connection'),
  ('Potlapally', '108508370', '382100260', (SELECT id FROM public.farms WHERE code='PPALLY'), 132.00, 'Primary connection'),
  ('Potlapally-2', '114422322', '382100396', (SELECT id FROM public.farms WHERE code='PPALLY'), 102.75, '2nd connection (from Oct-23)'),
  ('Kethireddypally', '103770721', '381900181', (SELECT id FROM public.farms WHERE code='KPALLY'), 52.50, 'Primary connection'),
  ('Feedmill', '112870608', '382100337', (SELECT id FROM public.farms WHERE code='FEEDMILL'), 74.25, 'Primary connection'),
  ('Hatchery', '112871659', '381800373', (SELECT id FROM public.farms WHERE code='FEEDMILL'), NULL, 'On hold from ~Mar-25')
ON CONFLICT (usc_no) DO UPDATE SET
  service_no = EXCLUDED.service_no,
  farm_id = EXCLUDED.farm_id,
  load_kw = EXCLUDED.load_kw,
  notes = EXCLUDED.notes;
