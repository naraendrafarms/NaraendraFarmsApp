-- Migration 1123: close Flock 22 out of the Kethireddypally brooding sheds on
-- 29/06/2026, and remove the one stray row that survived the move.
--
-- WHAT THE DATA SHOWS (migrations 1120-1122, all verified against live rows):
--   * Brooding sheds are 5, 6, 10, 11, 12 (owner-confirmed).
--   * All five last recorded on 28/06/2026, closing 10,211 / 6,931 / 7,267 /
--     10,329 / 10,346 -- together 45,084 birds.
--   * flock_transfers holds eleven rows dated 29/06/2026 totalling exactly
--     45,084, and on 30/06 the growing sheds (1,2,3,4,7,8,9) hold 45,074.
--     The move is real, recorded, and reconciles to within 10 birds.
--   * But no shed was ever closed out: each simply stops on 28/06 with birds
--     still standing, which is what let a later grid save resurrect one.
--   * Sheds 6, 10, 11 and 12 have no rows after the move. Shed 5 has exactly
--     one: 26/08/2026, opening 10,211, closing 10,211 -- a phantom.
--
-- WHAT THIS DOES
--   1. Deletes the single stray Shed 5 row of 26/08/2026.
--   2. Inserts a 29/06/2026 close-out row for each of the five sheds: opening
--      and transfer both equal to the 28/06 closing, closing zero.
--
-- Male counts are NOT assumed. Each row copies closing_male from its own 28/06
-- row, so a shed that held males closes out its males too and one that did not
-- stays at zero.
--
-- Flock 22's reported live count is NOT affected: it stands at 21,745 F /
-- 5,161 M, taken from the flock's latest record date, which is later than
-- 26/08 and has no brooding-shed row. The stray row only ever distorted
-- 26/08 itself. Nothing else changes.
--
-- Flock 23 now occupies all five of these sheds (10 and 11 from 05/08; 5, 6
-- and 12 from 17/08). Every statement below is filtered to Flock 22, so not
-- one Flock 23 row is touched.
--
-- Triggers are disabled so the written closings are exactly these figures
-- rather than trigger-recomputed, and so no cascade runs. Nothing sits after
-- 29/06 in these sheds once the stray is gone, so there is nothing to cascade
-- into in any case.

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_daily_opening;

-- 1. The stray row.
DELETE FROM public.daily_records d
USING public.sheds s, public.farms fm, public.flocks f
WHERE d.shed_id = s.id AND s.farm_id = fm.id AND d.flock_id = f.id
  AND f.flock_no::text = '22'
  AND fm.name = 'Kethireddypally'
  AND s.shed_no = '5'
  AND d.record_date = DATE '2026-08-26';

-- 2. The close-out rows, built from each shed's own 28/06 row.
INSERT INTO public.daily_records
  (flock_id, shed_id, farm_id, record_date,
   opening_female, opening_male, transfer_female, transfer_male,
   closing_female, closing_male, remarks)
SELECT d.flock_id, d.shed_id, d.farm_id, DATE '2026-06-29',
       COALESCE(d.closing_female,0), COALESCE(d.closing_male,0),
       COALESCE(d.closing_female,0), COALESCE(d.closing_male,0),
       0, 0,
       'Brooding to growing move 29/06/2026 - close-out added to match the recorded transfers'
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
JOIN public.sheds s  ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally'
  AND s.shed_no IN ('5','6','10','11','12')
  AND d.record_date = DATE '2026-06-28'
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_records x
    WHERE x.flock_id = d.flock_id AND x.shed_id = d.shed_id
      AND x.record_date = DATE '2026-06-29'
  );

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_daily_opening;
