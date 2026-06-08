-- Flock 20 master record
-- Kethireddypally (rearing) & BodjanamPet 1 (laying)
-- Female: paid=35499, free=1420, total=36920
-- Male: paid=4259, free=170, total=4430
INSERT INTO public.flocks (
  flock_no, breed,
  rearing_farm_id, laying_farm_id,
  placement_date, paid_female, paid_male, free_female, free_male,
  chick_rate, supplier, status
) VALUES (
  '20', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='BPET1'),
  '2025-05-30', 35499, 4259, 1420, 170,
  320, 'Venkateshwara Hatcheries', 'laying'
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
