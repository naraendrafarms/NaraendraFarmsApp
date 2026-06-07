-- Flock 19 master record
-- Kethireddypally (rearing) & Potlapally (laying)
-- Female: paid=44000, free=1700, total=45700
-- Male: paid=5280, free=210, total=5490
INSERT INTO public.flocks (
  flock_no, breed,
  rearing_farm_id, laying_farm_id,
  placement_date, paid_female, paid_male, free_female, free_male,
  chick_rate, supplier, status
) VALUES (
  '19', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='PPALLY'),
  '2025-02-16', 44000, 5280, 1700, 210,
  NULL, 'Venkateshwara Hatcheries', 'laying'
)
ON CONFLICT (flock_no) DO UPDATE SET
  breed            = EXCLUDED.breed,
  rearing_farm_id  = EXCLUDED.rearing_farm_id,
  laying_farm_id   = EXCLUDED.laying_farm_id,
  placement_date   = EXCLUDED.placement_date,
  paid_female      = EXCLUDED.paid_female,
  paid_male        = EXCLUDED.paid_male,
  free_female      = EXCLUDED.free_female,
  free_male        = EXCLUDED.free_male,
  chick_rate       = EXCLUDED.chick_rate,
  supplier         = EXCLUDED.supplier,
  status           = EXCLUDED.status;
