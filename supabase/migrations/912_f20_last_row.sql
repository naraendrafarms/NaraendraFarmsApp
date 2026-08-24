-- Migration 912: insert the very last missing Flock 20 row (2025-11-12, Kethireddypally shed2).
INSERT INTO public.daily_records
  (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks)
VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-12'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1347,147,156,18,0,207,27,763,53,1,3,376,64,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

SELECT 'f912_final_count' AS chk, count(*)::int AS n
  FROM public.daily_records WHERE remarks = 'F20_IMPORT_2026-08-24';
