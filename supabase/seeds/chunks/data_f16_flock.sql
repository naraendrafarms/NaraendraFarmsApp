-- Flock 16 master record
INSERT INTO public.flocks (
  flock_no, breed,
  rearing_farm_id, laying_farm_id,
  placement_date, paid_female, paid_male, free_female, free_male,
  chick_rate, supplier, status, close_date
) VALUES (
  '16', 'VENCO-430',
  (SELECT id FROM public.farms WHERE code='KPALLY'),
  (SELECT id FROM public.farms WHERE code='PPALLY'),
  -- paid_female=44000, paid_male=5280 (invoiced); free 4% = 1760F+211M
  -- Total DC = 45760F+5491M = 51251; brooded after transit mort = 45707F+5481M = 51188
  '2023-11-23', 44000, 5280, 1760, 211,
  320, 'Venkateshwara Hatcheries', 'closed', '2025-04-23'
)
ON CONFLICT (flock_no) DO UPDATE SET
  paid_female  = EXCLUDED.paid_female,
  paid_male    = EXCLUDED.paid_male,
  free_female  = EXCLUDED.free_female,
  free_male    = EXCLUDED.free_male,
  chick_rate   = EXCLUDED.chick_rate,
  status       = EXCLUDED.status,
  close_date   = EXCLUDED.close_date;
