-- Migration 899: test a single explicit INSERT from the specific chunk that
-- keeps failing (2025-12-02, shed5/Bodjanampet-1), with RETURNING.
INSERT INTO public.daily_records
  (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks)
VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-02'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','84e234de-8212-411e-9abd-4fe5f0ef0eb7',3816,361,530,46,1647,0,0,0,0,1,1,3815,360,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;
