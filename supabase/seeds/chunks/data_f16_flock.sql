-- File: data_f16_flock.sql
-- Flock 16 master record

INSERT INTO public.flocks (
  flock_no,
  breed,
  rearing_farm_id,
  laying_farm_id,
  placement_date,
  paid_female,
  paid_male,
  free_female,
  free_male,
  chick_rate,
  supplier,
  status,
  close_date
) VALUES (
  '16',
  'VENCO-430',
  (SELECT id FROM public.farms WHERE code = 'KPALLY'),
  (SELECT id FROM public.farms WHERE code = 'PPALLY'),
  '2023-11-23',
  45707,
  5481,
  0,
  0,
  320,
  'Venkateshwara Hatcheries',
  'closed',
  '2025-04-23'
)
ON CONFLICT (flock_no) DO UPDATE SET
  status = EXCLUDED.status,
  close_date = EXCLUDED.close_date;
