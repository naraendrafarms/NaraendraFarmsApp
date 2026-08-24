-- Migration 877: fix the cross-flock chain corruption caused by migration 868's
-- inserts. Root cause: trg_chain_daily_opening/trg_chain_cascade chain
-- opening_female/male off the PREVIOUS row by (shed_id, record_date) ONLY --
-- with no regard to flock_id. Since Kethireddypally sheds are reused across
-- Flock 19, 20, and 22, inserting Flock 20's historical rows caused the
-- trigger to re-chain Flock 19 and Flock 22 rows too.
--
-- Fix: recompute opening/closing PER FLOCK, PER SHED, ordered by date only
-- within that flock's own rows -- so each flock's chain is independent of
-- any other flock's rows in the same physical shed. Raw entered values
-- (mortality, cull, transfer, eggs, feed) are untouched by this recompute --
-- only the derived opening/closing counts are corrected.
--
-- Anchor: the first row of each (flock_id, shed_id) group keeps its CURRENTLY
-- STORED opening_female/male as the starting point (the true placement/arrival
-- value for that flock in that shed -- the point a chain starts, nothing legitimately
-- chains INTO it).

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
           COALESCE(d.received_female,0) AS rf, COALESCE(d.received_male,0) AS rm,
           COALESCE(d.mortality_female,0) AS mf, COALESCE(d.mortality_male,0) AS mm,
           COALESCE(d.cull_female,0) AS cf, COALESCE(d.cull_male,0) AS cm,
           COALESCE(d.trcull_female,0) AS trcf, COALESCE(d.trcull_male,0) AS trcm,
           COALESCE(d.transfer_female,0) AS tf, COALESCE(d.transfer_male,0) AS tm
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
     WHERE fl.flock_no::text IN ('19','20','22')
     ORDER BY d.flock_id, d.shed_id NULLS FIRST, d.record_date, d.id
  LOOP
    cur_key := r.flock_id::text || '|' || COALESCE(r.shed_id::text,'_');
    IF cur_key IS DISTINCT FROM prev_key THEN
      new_open_f := r.of;
      new_open_m := r.om;
    ELSE
      new_open_f := COALESCE(carry_f, r.of);
      new_open_m := COALESCE(carry_m, r.om);
    END IF;
    new_close_f := GREATEST(0, new_open_f + r.tif + r.rf - r.mf - r.cf - r.trcf - r.tf);
    new_close_m := GREATEST(0, new_open_m + r.tim + r.rm - r.mm - r.cm - r.trcm - r.tm);

    UPDATE public.daily_records
      SET opening_female = new_open_f, opening_male = new_open_m,
          closing_female = new_close_f, closing_male = new_close_m
      WHERE id = r.id;

    carry_f := new_close_f;
    carry_m := new_close_m;
    prev_key := cur_key;
  END LOOP;
END $$;

-- Verify: 0 formula mismatches and 0 continuity breaks, per flock, scoped correctly.
SELECT 'post_fix_formula_check' AS chk,
       string_agg((fl.flock_no::text || ':mismatches=' || cnt), ' | ' ORDER BY fl.flock_no) AS rows
  FROM (
    SELECT d.flock_id, count(*) AS cnt
      FROM public.daily_records d
     WHERE d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0)+COALESCE(d.transfer_in_female,0)+COALESCE(d.received_female,0)
             -COALESCE(d.mortality_female,0)-COALESCE(d.cull_female,0)-COALESCE(d.trcull_female,0)-COALESCE(d.transfer_female,0))
        OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0)+COALESCE(d.transfer_in_male,0)+COALESCE(d.received_male,0)
             -COALESCE(d.mortality_male,0)-COALESCE(d.cull_male,0)-COALESCE(d.trcull_male,0)-COALESCE(d.transfer_male,0))
     GROUP BY d.flock_id
  ) t
  JOIN public.flocks fl ON fl.id = t.flock_id
 WHERE fl.flock_no::text IN ('19','20','22');
