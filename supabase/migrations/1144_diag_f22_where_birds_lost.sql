-- Migration 1144: read-only. Pin down WHERE the Flock 22 birds go missing.
--
-- 1141 measured the window 26/08 - 03/09 and found:
--   females  out 29,180   in 21,907   -> 7,273 left a shed and never arrived
--   males    out  3,928   in  5,044   -> 1,116 arrived without leaving anywhere
--   register 29,180 F / 5,044 M
--
-- So for FEMALES the register agrees exactly with what was booked OUT, and the
-- shortfall is on the RECEIVING side. For MALES the register agrees with what
-- was booked IN, and the shortfall is on the GIVING side. Two different faults.
--
-- Consequence, from 1141 statement 5: the flock now reads 6,261 live males
-- against 5,491 ever placed -- 770 more males than exist.
--
-- This compares, per RECEIVING shed and per GIVING shed, what the register says
-- against what the daily records booked. Aggregated to one row per shed so the
-- log cannot truncate it.

-- [1] RECEIVING side: register says X arrived at this shed, daily records
-- booked Y. Any row where they differ is a transfer that did not land.
SELECT COALESCE(string_agg(t.line, ' || ' ORDER BY t.shed_no), 'ALL MATCH') AS receiving_gaps
FROM (
  SELECT s.shed_no,
         f.name || ' shed ' || s.shed_no
           || ': register ' || COALESCE(r.rf,0) || 'F/' || COALESCE(r.rm,0) || 'M'
           || ' vs booked ' || COALESCE(d.df,0) || 'F/' || COALESCE(d.dm,0) || 'M' AS line
  FROM public.sheds s
  JOIN public.farms f ON f.id = s.farm_id
  LEFT JOIN (
    SELECT t.to_shed_id sid, sum(t.female_count) rf, sum(t.male_count) rm
    FROM public.flock_transfers t JOIN public.flocks fl ON fl.id = t.flock_id
    WHERE fl.flock_no='22' AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
    GROUP BY 1) r ON r.sid = s.id
  LEFT JOIN (
    SELECT d.shed_id sid, sum(COALESCE(d.transfer_in_female,0)) df,
           sum(COALESCE(d.transfer_in_male,0)) dm
    FROM public.daily_records d JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
    GROUP BY 1) d ON d.sid = s.id
  WHERE (COALESCE(r.rf,0) <> COALESCE(d.df,0) OR COALESCE(r.rm,0) <> COALESCE(d.dm,0))
    AND (COALESCE(r.rf,0)+COALESCE(r.rm,0)+COALESCE(d.df,0)+COALESCE(d.dm,0)) > 0
) t;

-- [2] GIVING side: same comparison for transfers OUT.
SELECT COALESCE(string_agg(t.line, ' || ' ORDER BY t.shed_no), 'ALL MATCH') AS giving_gaps
FROM (
  SELECT s.shed_no,
         f.name || ' shed ' || s.shed_no
           || ': register ' || COALESCE(r.rf,0) || 'F/' || COALESCE(r.rm,0) || 'M'
           || ' vs booked ' || COALESCE(d.df,0) || 'F/' || COALESCE(d.dm,0) || 'M' AS line
  FROM public.sheds s
  JOIN public.farms f ON f.id = s.farm_id
  LEFT JOIN (
    SELECT t.from_shed_id sid, sum(t.female_count) rf, sum(t.male_count) rm
    FROM public.flock_transfers t JOIN public.flocks fl ON fl.id = t.flock_id
    WHERE fl.flock_no='22' AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
    GROUP BY 1) r ON r.sid = s.id
  LEFT JOIN (
    SELECT d.shed_id sid, sum(COALESCE(d.transfer_female,0)) df,
           sum(COALESCE(d.transfer_male,0)) dm
    FROM public.daily_records d JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE fl.flock_no='22' AND d.record_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03'
    GROUP BY 1) d ON d.sid = s.id
  WHERE (COALESCE(r.rf,0) <> COALESCE(d.df,0) OR COALESCE(r.rm,0) <> COALESCE(d.dm,0))
    AND (COALESCE(r.rf,0)+COALESCE(r.rm,0)+COALESCE(d.df,0)+COALESCE(d.dm,0)) > 0
) t;

-- [3] Every register row in the window, compact, so the whole movement plan is
-- visible in one field rather than a truncated row list.
SELECT string_agg(to_char(t.transfer_date,'DD/MM') || ' ' || COALESCE(fs.shed_no,'?')
                  || '>' || COALESCE(ts.shed_no,'?')
                  || ' ' || t.female_count || 'F/' || t.male_count || 'M',
                  ' | ' ORDER BY t.transfer_date, ts.shed_no) AS register_rows
FROM public.flock_transfers t
JOIN public.flocks fl ON fl.id = t.flock_id
LEFT JOIN public.sheds fs ON fs.id = t.from_shed_id
LEFT JOIN public.sheds ts ON ts.id = t.to_shed_id
WHERE fl.flock_no = '22'
  AND t.transfer_date BETWEEN DATE '2026-08-26' AND DATE '2026-09-03';

-- [4] Which sheds hold Flock 22 right now, with the impossible male total in
-- context: placed 5,491 M but the sheds add to 6,261 M.
SELECT string_agg(t.txt, ' | ' ORDER BY t.farm, t.shed_no) AS holding_now
FROM (
  SELECT f.name AS farm, s.shed_no,
         f.name || ' ' || s.shed_no || ' (' || d.record_date || '): '
           || d.closing_female || 'F/' || d.closing_male || 'M' AS txt
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms f ON f.id = s.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no='22'
    AND d.record_date = (SELECT max(y.record_date) FROM public.daily_records y
                         WHERE y.shed_id = d.shed_id AND y.flock_id = d.flock_id)
    AND (COALESCE(d.closing_female,0) > 0 OR COALESCE(d.closing_male,0) > 0)
) t;

-- [5] Total mortality and culls booked for Flock 22, so the 8,316 female drop
-- from placed to live can be split into real losses versus the 7,273 that
-- simply never arrived.
SELECT sum(COALESCE(d.mortality_female,0))::int AS mort_f,
       sum(COALESCE(d.mortality_male,0))::int AS mort_m,
       sum(COALESCE(d.cull_female,0))::int AS cull_f,
       sum(COALESCE(d.cull_male,0))::int AS cull_m
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22';
