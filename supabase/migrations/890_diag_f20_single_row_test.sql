-- Migration 890: test a single explicit INSERT with RETURNING to force
-- visibility of any real error for this gap window (previous attempts showed
-- "Errors: 0" but 0 rows landed -- suspect a silently-swallowed error).
INSERT INTO public.daily_records
  (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks)
VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1247,88,140,12,0,0,0,0,0,0,0,1247,88,'F20_IMPORT_2026-08-24')
RETURNING id;
