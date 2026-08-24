-- Migration 842: record Flock 19's INTERNAL Kethireddypally shed-to-shed moves
-- in flock_transfers (previously only the farm-level Kethireddypally->Agraharam
-- Potlapally shift was recorded, migration 836 -- the internal splits during
-- brooding, and the brooding->growing move, had no ledger rows at all even
-- though the birds themselves are already correctly reflected in daily_records
-- via transfer_female/transfer_in_female).
--
-- Brooding split (22-25 Feb 2025): exact single-source, single-destination
-- pairs, confirmed by matching each day's outgoing amount from a B-shed to the
-- identical incoming amount at a receiving B-shed:
--   22 Feb: shed 10 (B1) -> shed 5  (B4), 4896 F
--   23 Feb: shed 10 (B1) -> shed 5  (B4), 5352 F
--   23 Feb: shed 10 (B1) -> shed 6  (B5), 1880 F
--   25 Feb: shed 11 (B2) -> shed 12 (B3), 6723 F
-- 24 Feb is left OUT here: two sheds (B1 3348F, B2 5156F) emptied into two
-- destinations (shed 12 2940F, shed 6 5564F) the same day and the totals only
-- match in aggregate (8504 both sides) -- there is no way to tell which source
-- fed which destination without guessing, so it is not recorded shed-to-shed.
--
-- Brooding -> growing move (10 Apr 2025): all 5 brooding sheds emptied the
-- same day into 7 growing sheds (44,376 F both sides in aggregate) -- a full
-- reshuffle with no 1:1 source/destination match at all. Recorded with the
-- real destination shed and amount, from_shed_id left NULL (source honestly
-- unresolvable, not guessed).

INSERT INTO public.flock_transfers
  (flock_id, transfer_date, from_farm_id, to_farm_id, from_shed_id, to_shed_id, female_count, male_count, notes)
VALUES
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-02-22', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   'ea960057-3519-42d0-aa94-4feceb1acb8a', '90a3bcab-291e-401c-8c53-24bacb70272d', 4896, 0,
   'Internal brooding split (shed 10 to shed 5), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-02-23', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   'ea960057-3519-42d0-aa94-4feceb1acb8a', '90a3bcab-291e-401c-8c53-24bacb70272d', 5352, 0,
   'Internal brooding split (shed 10 to shed 5), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-02-23', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   'ea960057-3519-42d0-aa94-4feceb1acb8a', '8ae3cd8c-8616-48d0-b18d-7c600a55d0e2', 1880, 0,
   'Internal brooding split (shed 10 to shed 6), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-02-25', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   '25318f4b-5494-4e26-8211-9935d2d81722', 'd7ba9686-51c9-4c7c-9318-b9205330f153', 6723, 0,
   'Internal brooding split (shed 11 to shed 12), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, 'b272c67b-bf22-4301-8474-5fc970218c73', 6912, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, 'aeb8374d-c4e3-4f9e-81b8-2c22b250ec11', 6912, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, '6c3846cf-9d9f-4e9c-b813-67bf9083937e', 6864, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, '3235c0b9-b6ad-4890-bddf-bb1e6261d9c2', 8016, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, '233ab685-c474-475c-b761-798a6dc45548', 8064, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx'),
  ('d07f7336-7e6f-4cdb-841d-059fea1643b2', '2025-04-10', '62909634-e044-4232-bda7-7302b3a15f26', '62909634-e044-4232-bda7-7302b3a15f26',
   NULL, '808cb3e0-0777-4113-bfc1-374542e46e37', 7608, 0,
   'Brooding to growing move (multiple source sheds, unresolvable which fed which -- destination and amount only), reconstructed from Flock_19.xlsx');

SELECT 'f19_internal_transfers_after' AS chk, count(*)::int AS n
  FROM public.flock_transfers
 WHERE flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'
   AND from_farm_id = to_farm_id;
