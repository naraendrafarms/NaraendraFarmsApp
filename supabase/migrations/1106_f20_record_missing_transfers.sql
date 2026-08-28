-- Migration 1106: record Flock 20's 9 shed/site transfers, which were never
-- captured. Their absence is the root cause of the 25/08/2026 phantom-row
-- incident: with no transfer recorded, a vacated shed keeps its last closing
-- forever and stays in Bulk Daily Entry.
--
-- Counts come from Flock_20.xlsx (F-20 sheet). The Sep totals reconcile exactly
-- with what Bodjanampet-1 already recorded as received: 35,102 F and 4,127 M.
--
-- DELIBERATE: to_shed_id is left NULL on the three transfers whose destination
-- is a Kethireddypally shed (30/07, 06/09, 11/11). BulkDailyEntry.tsx builds its
-- shed list from flock_sheds UNION shed_allocations UNION flock_transfers
-- .to_shed_id with no date filter, so naming a vacated shed there would put it
-- straight back into Flock 20's entry grid and re-create the phantom rows that
-- migration 1098 just removed. from_shed_id is recorded wherever the source is a
-- single known shed, which is the traceability that was actually missing.

INSERT INTO public.flock_transfers
  (flock_id, transfer_date, from_farm_id, to_farm_id, from_shed_id, to_shed_id,
   female_count, male_count, notes)
SELECT '63f8e45a-d50b-4dad-ad71-90f634abc4f0', v.dt::date,
       (SELECT id FROM public.farms WHERE name = v.from_farm),
       (SELECT id FROM public.farms WHERE name = v.to_farm),
       CASE WHEN v.from_shed IS NULL THEN NULL ELSE
         (SELECT s.id FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
          WHERE fm.name = v.from_farm AND s.shed_no = v.from_shed) END,
       NULL,
       v.f, v.m, v.note
FROM (VALUES
  ('2025-07-30','Kethireddypally','Kethireddypally','9',    20,   0,'F20 transfer reconstructed from Flock_20.xlsx: G7 to G2'),
  ('2025-09-06','Kethireddypally','Kethireddypally','9',    90,   0,'F20 transfer reconstructed from Flock_20.xlsx: G7 to G2'),
  ('2025-09-24','Kethireddypally','Bodjanampet - 1',NULL,11200,   0,'F20 grower to laying: G1+G3+G4 to Bpet sheds 1-2'),
  ('2025-09-25','Kethireddypally','Bodjanampet - 1',NULL,11200,   0,'F20 grower to laying: G4+G5+G6 to Bpet sheds 2-4'),
  ('2025-09-27','Kethireddypally','Bodjanampet - 1',NULL, 8960,   0,'F20 grower to laying: G2+G6+G7 to Bpet sheds 4-7'),
  ('2025-09-28','Kethireddypally','Bodjanampet - 1',NULL, 3742,4127,'F20 grower to laying: G7 females, G2 males to Bpet sheds 1-7'),
  ('2025-11-11','Bodjanampet - 1','Kethireddypally',NULL,  104,  67,'F20 returned to Kethireddypally G2 (held-back birds)'),
  ('2025-11-12','Kethireddypally','Bodjanampet - 1','2',   207,  27,'F20 Kpally-G2 back to Bpet sheds 1-7'),
  ('2025-12-26','Kethireddypally','Bodjanampet - 1','2',   355,  56,'F20 final move out of Kethireddypally, Kpally-G2 to Bpet sheds 1-7')
) AS v(dt, from_farm, to_farm, from_shed, f, m, note)
WHERE NOT EXISTS (
  SELECT 1 FROM public.flock_transfers ft
  WHERE ft.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
    AND ft.transfer_date = v.dt::date
);

SELECT count(*)::int AS f20_transfers_now,
       COALESCE(sum(female_count),0)::int AS total_f,
       COALESCE(sum(male_count),0)::int AS total_m
FROM public.flock_transfers
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0';
