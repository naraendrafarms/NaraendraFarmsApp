-- Migration 1120: read-only. Why does Kethireddypally Shed 5 show birds for
-- Flock 22 on 26/08/2026 when it showed nothing on 25/08/2026, and is any other
-- shed doing the same?

-- 1. Every Flock 22 row on the two dates, shed by shed.
SELECT string_agg(x.line, ' | ' ORDER BY x.line) AS f22_two_days
FROM (
  SELECT to_char(d.record_date,'DD') || ' ' || fm.name || '-' || s.shed_no
         || ': op=' || COALESCE(d.opening_female,0) || '/' || COALESCE(d.opening_male,0)
         || ' rcv=' || COALESCE(d.received_female,0)
         || ' trf=' || COALESCE(d.transfer_female,0)
         || ' mort=' || COALESCE(d.mortality_female,0)
         || ' cull=' || COALESCE(d.cull_female,0)
         || ' cl=' || COALESCE(d.closing_female,0) || '/' || COALESCE(d.closing_male,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  LEFT JOIN public.farms fm ON fm.id = s.farm_id
  WHERE d.record_date IN (DATE '2026-08-25', DATE '2026-08-26')
) x;

-- 2. Kethireddypally Shed 5 for Flock 22 -- its whole history, to see where a
--    non-zero opening could have come from.
SELECT COALESCE(string_agg(y.line, ' | ' ORDER BY y.line), 'NO ROWS') AS kp_shed5_history
FROM (
  SELECT to_char(d.record_date,'YYYY-MM-DD') || ' op=' || COALESCE(d.opening_female,0)
         || ' rcv=' || COALESCE(d.received_female,0) || ' trf=' || COALESCE(d.transfer_female,0)
         || ' cl=' || COALESCE(d.closing_female,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no = '5'
) y;

-- 3. Is any OTHER flock also holding Kethireddypally Shed 5? A stale closing
--    from a different flock is how the grid pre-fills a vacated shed.
SELECT COALESCE(string_agg(z.line, ' | ' ORDER BY z.line), 'NONE') AS kp_shed5_all_flocks
FROM (
  SELECT f.flock_no || ': rows=' || count(*)::text
         || ' last=' || max(d.record_date)::text
         || ' lastclose=' || (array_agg(COALESCE(d.closing_female,0) ORDER BY d.record_date DESC))[1]::text AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no = '5'
  GROUP BY f.flock_no
) z;

-- 4. THE STRUCTURAL TEST, across every Flock 22 shed: a row on 26/08 whose
--    opening does not equal the previous row's closing for that same shed.
--    That is the signature of the phantom-row fault fixed for Flock 20.
SELECT COALESCE(string_agg(w.line, ' | ' ORDER BY w.line), 'ALL CHAINS OK') AS broken_chains
FROM (
  SELECT fm.name || '-' || s.shed_no || ' on ' || d.record_date::text
         || ': opening=' || COALESCE(d.opening_female,0)
         || ' but previous closing=' || COALESCE(prev.closing_female,0) AS line
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id AND f.flock_no::text = '22'
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  LEFT JOIN LATERAL (
    SELECT p.closing_female
    FROM public.daily_records p
    WHERE p.flock_id = d.flock_id AND p.shed_id = d.shed_id
      AND p.record_date < d.record_date
    ORDER BY p.record_date DESC LIMIT 1
  ) prev ON TRUE
  WHERE d.record_date BETWEEN DATE '2026-08-20' AND DATE '2026-08-27'
    AND COALESCE(d.opening_female,0) <> COALESCE(prev.closing_female,0)
    AND prev.closing_female IS NOT NULL
) w;

-- 5. Which sheds is Flock 22 actually linked to, and does that include Shed 5?
SELECT COALESCE(string_agg(fm.name || '-' || s.shed_no, ', ' ORDER BY fm.name, s.shed_no), 'NONE') AS f22_linked_sheds
FROM public.flock_sheds fs
JOIN public.sheds s ON s.id = fs.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
JOIN public.flocks f ON f.id = fs.flock_id
WHERE f.flock_no::text = '22';
