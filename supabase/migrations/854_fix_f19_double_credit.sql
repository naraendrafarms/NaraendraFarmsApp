-- Migration 854: fix the double-credit caused by migration 842's flock_transfers
-- inserts triggering trg_flock_transfer_credit (migration 228), which added
-- transfer_in_female/male to 10 destination-shed rows on top of birds already
-- placed correctly by the original 761-row import (migrations 833_1-6).
--
-- Step 1: subtract the exact over-credited amount from the 10 origin rows'
-- transfer_in_female/male -- undoing precisely what the trigger added, nothing
-- more (each amount matches the corresponding flock_transfers.female_count).
--
-- Step 2: full opening/closing re-chain for Flock 19's daily_records (same
-- one-time-recompute technique as migrations 200 and 225), so the correction
-- cascades forward through every day after each corrected row, all the way to
-- the point Flock 19's Kethireddypally data ends (23/06/2025 is where the
-- already-correct live app data picks up, and that data was never touched by
-- migration 842 -- so the boundary rows already tie in as verified before,
-- and this pass will preserve that since AP farm daily_records is untouched
-- by these WHERE clauses).

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 4896
 WHERE shed_id = '90a3bcab-291e-401c-8c53-24bacb70272d' AND record_date = '2025-02-22'; -- sh5

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 5352
 WHERE shed_id = '90a3bcab-291e-401c-8c53-24bacb70272d' AND record_date = '2025-02-23'; -- sh5

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 1880
 WHERE shed_id = '8ae3cd8c-8616-48d0-b18d-7c600a55d0e2' AND record_date = '2025-02-23'; -- sh6

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 6723
 WHERE shed_id = 'd7ba9686-51c9-4c7c-9318-b9205330f153' AND record_date = '2025-02-25'; -- sh12

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 6912
 WHERE shed_id = 'b272c67b-bf22-4301-8474-5fc970218c73' AND record_date = '2025-04-10'; -- sh1

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 6912
 WHERE shed_id = 'aeb8374d-c4e3-4f9e-81b8-2c22b250ec11' AND record_date = '2025-04-10'; -- sh3

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 6864
 WHERE shed_id = '6c3846cf-9d9f-4e9c-b813-67bf9083937e' AND record_date = '2025-04-10'; -- sh4

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 8016
 WHERE shed_id = '3235c0b9-b6ad-4890-bddf-bb1e6261d9c2' AND record_date = '2025-04-10'; -- sh7

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 8064
 WHERE shed_id = '233ab685-c474-475c-b761-798a6dc45548' AND record_date = '2025-04-10'; -- sh8

UPDATE public.daily_records
   SET transfer_in_female = COALESCE(transfer_in_female,0) - 7608
 WHERE shed_id = '808cb3e0-0777-4113-bfc1-374542e46e37' AND record_date = '2025-04-10'; -- sh9

-- Full re-chain for Flock 19 only (same logic as migration 200's one-time recompute).
DO $$
DECLARE
  r RECORD;
  prev_key TEXT := NULL;
  cur_key  TEXT;
  carry_f  INT := NULL;
  carry_m  INT := NULL;
  new_open_f INT;
  new_open_m INT;
  new_close_f INT;
  new_close_m INT;
BEGIN
  FOR r IN
    SELECT d.id, d.flock_id, d.shed_id, d.record_date,
           COALESCE(d.opening_female,0) AS of, COALESCE(d.opening_male,0) AS om,
           COALESCE(d.transfer_in_female,0) AS tif, COALESCE(d.transfer_in_male,0) AS tim,
           COALESCE(d.mortality_female,0) AS mf, COALESCE(d.mortality_male,0) AS mm,
           COALESCE(d.cull_female,0) AS cf, COALESCE(d.cull_male,0) AS cm,
           COALESCE(d.transfer_female,0) AS tf, COALESCE(d.transfer_male,0) AS tm
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
     WHERE f.flock_no::text = '19'
     ORDER BY d.shed_id NULLS FIRST, d.record_date, d.id
  LOOP
    cur_key := r.flock_id::text || '|' || COALESCE(r.shed_id::text,'_');
    IF cur_key IS DISTINCT FROM prev_key THEN
      new_open_f := r.of;
      new_open_m := r.om;
    ELSE
      new_open_f := COALESCE(carry_f, r.of);
      new_open_m := COALESCE(carry_m, r.om);
    END IF;
    new_close_f := GREATEST(0, new_open_f + r.tif - r.mf - r.cf - r.tf);
    new_close_m := GREATEST(0, new_open_m + r.tim - r.mm - r.cm - r.tm);

    UPDATE public.daily_records
      SET opening_female = new_open_f, opening_male = new_open_m,
          closing_female = new_close_f, closing_male = new_close_m
      WHERE id = r.id;

    carry_f := new_close_f;
    carry_m := new_close_m;
    prev_key := cur_key;
  END LOOP;
END $$;

-- Verify: shed5's chain should now read 4896 -> (close 4896) -> open 4896+5352=10248 -> etc.
SELECT 'f19_shed5_after_fix' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND s.shed_no = '5'
       AND d.record_date BETWEEN '2025-02-22' AND '2025-02-26'
     ORDER BY d.record_date
  ) x;

-- Confirm 0 continuity breaks flock-wide after the fix, and the 23/06/2025 boundary still ties in.
WITH chained AS (
  SELECT d.id, d.shed_id, d.record_date, d.opening_female,
         LAG(d.closing_female) OVER (PARTITION BY d.shed_id ORDER BY d.record_date, d.id) AS prev_close
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '19'
)
SELECT 'f19_continuity_breaks_after_fix' AS chk, COUNT(*)::int AS n
  FROM chained WHERE prev_close IS NOT NULL AND opening_female <> prev_close;
