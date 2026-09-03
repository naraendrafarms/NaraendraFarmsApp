-- Migration 1141: read-only. Flock 22 transfers do not tie up.
--
-- From the owner's two screens on 30/08/2026:
--   Bulk Daily Entry totals   -- transferred OUT 1,140 F / 1,128 M
--                                RECEIVED IN     1,140 F / 2,244 M
--   Flock Transfers register  -- Shed 2 -> Shed 4  453 F / 1,116 M
--                                Shed 2 -> Shed 3    -   / 1,128 M
--                                i.e. 453 F / 2,244 M
--
-- Three things disagree, and each needs measuring rather than eyeballing:
--   A. MALE OUT: the daily grid shows Kethireddypally Shed 2 giving 1,128 M,
--      but the register says Shed 2 gave 1,116 + 1,128 = 2,244 M -- which is
--      also exactly what the Agraharam sheds received. So 1,116 M appear to
--      have arrived without ever being booked out.
--   B. FEMALE OUT: the grid shows 1,140 F leaving -- 453 from Shed 2 and 687
--      from Shed 9 -- but the register only carries the 453. The 687 from
--      Shed 9 is in the daily records and not in the register.
--   C. Shed 2's closing male (1,219) is consistent with only 1,128 leaving. If
--      2,244 really left, its closing should be far lower.
--
-- Nothing is written. Every statement is a SELECT.

-- [1] Daily records: every Flock 22 movement row in the window, by shed.
SELECT f.name AS farm, s.shed_no, d.record_date,
       d.opening_female AS op_f, d.opening_male AS op_m,
       COALESCE(d.transfer_in_female,0) AS in_f, COALESCE(d.transfer_in_male,0) AS in_m,
       COALESCE(d.transfer_female,0) AS out_f, COALESCE(d.transfer_male,0) AS out_m,
       d.closing_female AS cl_f, d.closing_male AS cl_m
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22'
  AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
  AND (COALESCE(d.transfer_in_female,0) + COALESCE(d.transfer_in_male,0)
     + COALESCE(d.transfer_female,0) + COALESCE(d.transfer_male,0)) > 0
ORDER BY d.record_date, f.name, s.shed_no;

-- [2] The whole window in one line: does OUT equal IN in the daily records?
-- If these differ, birds are appearing or vanishing between sheds.
SELECT sum(COALESCE(d.transfer_female,0))::int AS total_out_f,
       sum(COALESCE(d.transfer_male,0))::int AS total_out_m,
       sum(COALESCE(d.transfer_in_female,0))::int AS total_in_f,
       sum(COALESCE(d.transfer_in_male,0))::int AS total_in_m,
       (sum(COALESCE(d.transfer_in_female,0)) - sum(COALESCE(d.transfer_female,0)))::int AS f_in_minus_out,
       (sum(COALESCE(d.transfer_in_male,0)) - sum(COALESCE(d.transfer_male,0)))::int AS m_in_minus_out
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22'
  AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03';

-- [3] The register for the same window, shed to shed.
SELECT t.transfer_date,
       fs.shed_no AS from_shed, ts.shed_no AS to_shed,
       t.female_count, t.male_count
FROM public.flock_transfers t
JOIN public.flocks fl ON fl.id = t.flock_id
LEFT JOIN public.sheds fs ON fs.id = t.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = t.to_shed_id
WHERE fl.flock_no = '22'
  AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
ORDER BY t.transfer_date, ts.shed_no;

-- [4] Register total against daily-records total, the direct comparison.
SELECT (SELECT COALESCE(sum(t.female_count),0)::int FROM public.flock_transfers t
        JOIN public.flocks fl ON fl.id = t.flock_id
        WHERE fl.flock_no='22' AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03') AS register_f,
       (SELECT COALESCE(sum(t.male_count),0)::int FROM public.flock_transfers t
        JOIN public.flocks fl ON fl.id = t.flock_id
        WHERE fl.flock_no='22' AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03') AS register_m,
       (SELECT COALESCE(sum(COALESCE(d.transfer_female,0)),0)::int FROM public.daily_records d
        JOIN public.flocks fl ON fl.id = d.flock_id
        WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03') AS daily_out_f,
       (SELECT COALESCE(sum(COALESCE(d.transfer_male,0)),0)::int FROM public.daily_records d
        JOIN public.flocks fl ON fl.id = d.flock_id
        WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03') AS daily_out_m;

-- [5] Has the flock's live total changed? Placed against what the sheds hold
-- on each shed's own latest date. If birds were received without being booked
-- out, live will now EXCEED what a straight placed-minus-losses would give.
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
