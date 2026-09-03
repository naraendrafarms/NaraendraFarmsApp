-- Migration 1145: correct the two Flock 22 transfer faults found by 1144.
--
-- FAULT 1 -- Agraharam Potlapally Shed 2, 26/08/2026.
--   The register books 5,704 F out of Kethireddypally Shed 1 and 1,569 F out of
--   Shed 7 into it that day (7,273 F). Both were booked OUT correctly and never
--   booked IN, so 7,273 females left a shed and landed nowhere.
--   Fix: transfer_in_female = 7,273 on that row.
--
-- FAULT 2 -- Kethireddypally Shed 2, 30/08/2026.
--   The register books 1,128 M to Shed 3 and 1,116 M to Shed 4 that day
--   (2,244 M). Agraharam Shed 4 recorded receiving its 1,116, but Shed 2 was
--   only reduced by 1,128, so those birds are counted in two places at once.
--   Fix: transfer_male = 2,244 on that row.
--
-- PROOF THIS IS RIGHT, not merely plausible. Flock 22 placed 45,760 F / 5,491 M
-- with 1,043 F / 348 M mortality and no culls:
--   females  45,760 - 1,043 = 44,717   and 37,444 + 7,273 = 44,717   -- exact
--   males     5,491 -   348 =  5,143   and  6,261 - 1,116 =  5,145   -- 2 out
-- Owner confirmed the 7,273 females are physically in Agraharam Shed 2 and that
-- 26/08 is the correct arrival date.
--
-- TRIGGERS ARE LEFT ENABLED ON PURPOSE. Unlike migration 1123, which inserted
-- close-out rows and had to suppress the cascade, here the cascade is exactly
-- what is wanted: each corrected row must carry its new closing forward through
-- the following days. Nothing is deleted and no row is created.
--
-- Both updates are guarded on the value being corrected, so re-running this
-- migration cannot apply the correction twice.

DO $$
DECLARE f1 INT; f2 INT;
BEGIN
  -- Fault 1: the missing receipt.
  UPDATE public.daily_records d
  SET transfer_in_female = 7273
  FROM public.sheds s, public.farms f
  WHERE s.id = d.shed_id AND f.id = s.farm_id
    AND f.name = 'Agraharam Potlapally' AND s.shed_no = '2'
    AND d.record_date = DATE '2026-08-26'
    AND COALESCE(d.transfer_in_female, 0) = 0;
  GET DIAGNOSTICS f1 = ROW_COUNT;

  -- Fault 2: the missing transfer out.
  UPDATE public.daily_records d
  SET transfer_male = 2244
  FROM public.sheds s, public.farms f
  WHERE s.id = d.shed_id AND f.id = s.farm_id
    AND f.name = 'Kethireddypally' AND s.shed_no = '2'
    AND d.record_date = DATE '2026-08-30'
    AND COALESCE(d.transfer_male, 0) = 1128;
  GET DIAGNOSTICS f2 = ROW_COUNT;

  RAISE NOTICE 'fault1 rows=% fault2 rows=%', f1, f2;

  -- If either found nothing, the row is not where it was measured and the
  -- correction must not be assumed applied. Fail loudly rather than leave a
  -- half-done fix looking successful.
  IF f1 <> 1 OR f2 <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row each; got fault1=% fault2=%. Nothing applied.', f1, f2;
  END IF;
END
$$;

-- VERIFY 1: the two corrected rows, and what they now close at.
SELECT f.name || ' shed ' || s.shed_no || ' ' || d.record_date AS row_fixed,
       COALESCE(d.transfer_in_female,0) AS in_f, COALESCE(d.transfer_male,0) AS out_m,
       d.closing_female, d.closing_male
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
WHERE (f.name = 'Agraharam Potlapally' AND s.shed_no = '2' AND d.record_date = DATE '2026-08-26')
   OR (f.name = 'Kethireddypally'      AND s.shed_no = '2' AND d.record_date = DATE '2026-08-30')
ORDER BY 1;

-- VERIFY 2: the flock total. Expect live_f = 44,717 and live_m = 5,145.
-- If the cascade did not carry the correction forward, these will not move and
-- that must be visible rather than assumed.
SELECT (fl.paid_female + COALESCE(fl.free_female,0))::int AS placed_f,
       (fl.paid_male + COALESCE(fl.free_male,0))::int AS placed_m,
       (SELECT sum(x.closing_female)::int FROM public.daily_records x
        WHERE x.flock_id = fl.id
          AND x.record_date = (SELECT max(y.record_date) FROM public.daily_records y
                               WHERE y.shed_id = x.shed_id AND y.flock_id = x.flock_id)) AS live_f,
       (SELECT sum(x.closing_male)::int FROM public.daily_records x
        WHERE x.flock_id = fl.id
          AND x.record_date = (SELECT max(y.record_date) FROM public.daily_records y
                               WHERE y.shed_id = x.shed_id AND y.flock_id = x.flock_id)) AS live_m
FROM public.flocks fl WHERE fl.flock_no = '22';

-- VERIFY 3: out and in now agree, the register matches the daily records, and
-- both chain triggers are still enabled.
SELECT (SELECT sum(COALESCE(d.transfer_in_female,0)) - sum(COALESCE(d.transfer_female,0))
        FROM public.daily_records d JOIN public.flocks fl ON fl.id = d.flock_id
        WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03')::int AS f_in_minus_out,
       (SELECT sum(COALESCE(d.transfer_in_male,0)) - sum(COALESCE(d.transfer_male,0))
        FROM public.daily_records d JOIN public.flocks fl ON fl.id = d.flock_id
        WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03')::int AS m_in_minus_out,
       (SELECT count(*)::int FROM pg_trigger
        WHERE tgrelid = 'public.daily_records'::regclass AND NOT tgisinternal
          AND tgenabled::text = 'O') AS triggers_enabled,
       (SELECT count(*)::int FROM public.daily_records) AS total_rows;
