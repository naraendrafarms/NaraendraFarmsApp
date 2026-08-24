-- Migration 910: insert the exact final 13 missing Flock 20 rows,
-- identified via a full expected-vs-actual diff, individually with RETURNING.

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-06'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','84e234de-8212-411e-9abd-4fe5f0ef0eb7',3816,378,428.0,47.0,0,0,0,0,0,1,0,3815,378,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-06'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','eb46b1f0-0d89-4893-ac7c-0e9ca1ad86c5',4057,408,454.0,51.0,0,0,0,0,0,0,0,4057,408,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-06'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','1cc2634f-615b-4ea2-a016-280d460cd20c',4052,412,454.0,52.0,0,0,0,0,0,0,0,4052,412,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-11-12'::date,'62909634-e044-4232-bda7-7302b3a15f26','678fa4de-c9e1-4e8a-965c-40d21b5eaf47',1347,147,156.0,18.0,0,207,27,763,53,1,3,376,64,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-02'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','d1280d0e-ca04-4f17-a285-0e91063bccc7',5813,669,756.0,86.0,1751,0,0,0,0,1,0,5812,669,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-02'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','4527ec6f-a889-4911-adf1-145513da93bf',5809,665,773.0,85.0,2226,0,0,0,0,1,1,5808,664,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-02'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','1b4cd0c3-367b-4496-8767-150602cadae2',5774,676,751.0,87.0,1709,0,0,0,0,2,0,5772,676,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-02'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','c1359f2f-263d-417d-9a92-2b2235f6a7fd',5790,751,787.0,96.0,2276,0,0,0,0,2,0,5788,751,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-14'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','d1280d0e-ca04-4f17-a285-0e91063bccc7',5796,668,869.0,86.0,3341,0,0,0,0,1,0,5795,668,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-14'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','4527ec6f-a889-4911-adf1-145513da93bf',5794,660,898.0,85.0,3963,0,0,0,0,3,0,5791,660,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-14'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','1b4cd0c3-367b-4496-8767-150602cadae2',5748,667,839.0,86.0,2956,0,0,0,0,0,0,5748,667,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-14'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','c1359f2f-263d-417d-9a92-2b2235f6a7fd',5771,748,895.0,96.0,3545,0,0,0,0,3,0,5768,748,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;

INSERT INTO public.daily_records (flock_id, record_date, farm_id, shed_id, opening_female, opening_male, feed_female_kg, feed_male_kg, total_eggs, received_female, received_male, trcull_female, trcull_male, mortality_female, mortality_male, closing_female, closing_male, remarks) VALUES
  ('63f8e45a-d50b-4dad-ad71-90f634abc4f0','2025-12-14'::date,'d9ce0b1d-01bd-4011-ba1b-9c4379d48d1d','84e234de-8212-411e-9abd-4fe5f0ef0eb7',3797,359,608.0,46.0,2562,0,0,0,0,3,0,3794,359,'F20_IMPORT_2026-08-24')
RETURNING id, record_date, shed_id;
