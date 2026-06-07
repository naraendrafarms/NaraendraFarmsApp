-- Flock 17 master record
-- Placed over 2 days: Mar 30 = 15098F+3006M; Mar 31 = 21801F+1420M = 36899F+4426M total
-- Paid (96%) approx: 35480F+4250M=39730; Free (4%): 1419F+176M=1595
-- Total placed_f=36899, placed_m=4426 (= paid+free)
INSERT INTO public.flocks (
  flock_no, breed,
  rearing_farm_id, laying_farm_id,
  placement_date, paid_female, paid_male, free_female, free_male,
  chick_rate, supplier, status
) VALUES (
  '17', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='BPET1'),
  '2024-03-30', 35480, 4250, 1419, 176,
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
