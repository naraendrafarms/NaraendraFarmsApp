-- Migration 906: insert the final true gap -- 2025-11-07 to 2025-11-12,
-- 6 rows, one per statement with RETURNING for full visibility.

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1247,88,140.0,12.0,0,0,0,0,0,0,0,1247,88,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','d1280d0e-ca04-4f17-a285-0e91063bccc7',5788,690,648.0,87.0,0,0,0,0,0,0,0,5788,690,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','4527ec6f-a889-4911-adf1-145513da93bf',5783,686,648.0,86.0,1,0,0,0,0,0,0,5783,686,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','1b4cd0c3-367b-4496-8767-150602cadae2',5751,694,645.0,87.0,0,0,0,0,0,0,0,5751,694,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','c1359f2f-263d-417d-9a92-2b2235f6a7fd',5772,780,647.0,98.0,1,0,0,0,0,0,1,5772,779,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','84e234de-8212-411e-9abd-4fe5f0ef0eb7',3815,378,428.0,47.0,0,0,0,0,0,1,0,3814,378,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','eb46b1f0-0d89-4893-ac7c-0e9ca1ad86c5',4057,408,454.0,51.0,0,0,0,0,0,0,1,4057,407,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-07'::date,'62909634-e044-4232-bda7-7302b3a15f26','1cc2634f-615b-4ea2-a016-280d460cd20c',4052,412,454.0,52.0,0,0,0,0,0,0,0,4052,412,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1247,88,140.0,12.0,0,0,0,0,0,1,2,1246,86,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','d1280d0e-ca04-4f17-a285-0e91063bccc7',5788,690,648.0,87.0,2,0,0,0,0,0,0,5788,690,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','4527ec6f-a889-4911-adf1-145513da93bf',5783,686,648.0,86.0,1,0,0,0,0,0,0,5783,686,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','1b4cd0c3-367b-4496-8767-150602cadae2',5751,694,645.0,87.0,0,0,0,0,0,0,0,5751,694,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','c1359f2f-263d-417d-9a92-2b2235f6a7fd',5772,779,647.0,98.0,2,0,0,0,0,0,1,5772,778,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','84e234de-8212-411e-9abd-4fe5f0ef0eb7',3814,378,428.0,47.0,0,0,0,0,0,0,0,3814,378,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','eb46b1f0-0d89-4893-ac7c-0e9ca1ad86c5',4057,407,454.0,51.0,1,0,0,0,0,0,0,4057,407,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-08'::date,'62909634-e044-4232-bda7-7302b3a15f26','1cc2634f-615b-4ea2-a016-280d460cd20c',4052,412,454.0,52.0,1,0,0,0,0,0,0,4052,412,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-09'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1246,86,145.0,11.0,0,0,0,0,0,1,1,1245,85,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-10'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1245,85,145.0,11.0,0,0,0,0,0,0,2,1245,83,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-11'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1245,83,145.0,11.0,0,104,67,0,0,2,3,1347,147,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-12'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1347,147,156.0,18.0,0,207,27,763,53,1,3,376,64,'F20_IMPORT_2026-08-24')
RETURNING id, record_date;
