-- Migration 836: record the Kethireddypally -> Agraharam Potlapally site shift
-- for Flock 19 in public.flock_transfers (was 0 rows before this -- the shed-level
-- daily_records already carry the birds via transfer_female/transfer_in_female,
-- migrations 833_1-6; this is the farm-level ledger entry so the move shows up
-- wherever the app reads flock_transfers directly).
--
-- Farm-level only (no from_shed_id/to_shed_id): the file shows several
-- Kethireddypally growing sheds feeding into an Agraharam Potlapally shed across
-- multiple days each, so a single-shed-to-single-shed pairing per row would be a
-- guess. Totals per day are exact -- reconstructed from Flock_19.xlsx and cross-
-- checked against the earlier transfer analysis (43,194 F / 4,818 M total).
INSERT INTO public.flock_transfers
  (flock_id, transfer_date, from_farm_id, to_farm_id, female_count, male_count, notes)
VALUES
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-11', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 7800, 0, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-12', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 7000, 0, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-13', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 8400, 0, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-14', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 7000, 0, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-15', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 8400, 0, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-16', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 4594, 1056, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-06-17', '62909634-e044-4232-bda7-7302b3a15f26', '8a8d2738-32b2-44d2-a9b3-d83c2de05747', 0, 3762, 'Kethireddypally to Agraharam Potlapally site shift, reconstructed from Flock_19.xlsx');

SELECT 'f19_transfers_after' AS chk, count(*)::int AS n,
       sum(female_count)::int AS total_f, sum(male_count)::int AS total_m
  FROM public.flock_transfers
 WHERE flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2';
