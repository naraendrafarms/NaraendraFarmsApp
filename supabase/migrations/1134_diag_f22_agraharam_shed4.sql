-- Migration 1134: read-only. Why Agraharam Potlapally Shed 4 still shows
-- Flock 19, and what would be needed to bring Flock 22 into it.
--
-- Owner states: Flock 19 is CLOSED, and Flock 22 birds arrive in the August
-- entries, transferred in from Kethireddypally. Shed 4's latest daily record is
-- Flock 19 on 13/06/2026 while sheds 1-3 are on Flock 22 to 26/08/2026, so
-- something is either not entered or not transferred. Measuring it before
-- proposing anything.
--
-- Nothing is written. Every statement is a SELECT.

-- [1] Flock 19 and Flock 22 headline state: status, dates, farms.
SELECT fl.flock_no, fl.status, fl.placement_date,
       rf.name AS rearing_farm, lf.name AS laying_farm,
       (SELECT max(d.record_date) FROM public.daily_records d WHERE d.flock_id = fl.id) AS last_record
FROM public.flocks fl
LEFT JOIN public.farms rf ON rf.id = fl.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = fl.laying_farm_id
WHERE fl.flock_no IN ('19','22')
ORDER BY fl.flock_no;

-- [2] Flock 22 at Agraharam, shed by shed: when it starts and ends, and what
-- arrived. Shed 4 is expected to be absent entirely.
SELECT s.shed_no,
       min(d.record_date) AS first_record,
       max(d.record_date) AS last_record,
       count(*)::int AS days,
       sum(COALESCE(d.transfer_in_female,0))::int AS recd_f,
       sum(COALESCE(d.transfer_in_male,0))::int AS recd_m
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE f.name = 'Agraharam Potlapally' AND fl.flock_no = '22'
GROUP BY s.shed_no ORDER BY s.shed_no;

-- [3] Every recorded Flock 22 transfer, either direction. This is what tells us
-- whether a move to Agraharam Shed 4 was ever booked at all.
SELECT t.transfer_date,
       ff.name AS from_farm, fs.shed_no AS from_shed,
       tf.name AS to_farm,   ts.shed_no AS to_shed,
       t.female_count, t.male_count, t.notes
FROM public.flock_transfers t
JOIN public.flocks fl ON fl.id = t.flock_id
LEFT JOIN public.sheds fs ON fs.id = t.from_shed_id
LEFT JOIN public.farms ff ON ff.id = fs.farm_id
LEFT JOIN public.sheds ts ON ts.id = t.to_shed_id
LEFT JOIN public.farms tf ON tf.id = ts.farm_id
WHERE fl.flock_no = '22'
ORDER BY t.transfer_date, ts.shed_no;

-- [4] Where Flock 22 birds are sitting right now, by farm and shed, on each
-- shed's own latest date -- so the total can be compared against what was
-- placed and what is still at Kethireddypally waiting to move.
SELECT f.name AS farm, s.shed_no, d.record_date,
       d.closing_female, d.closing_male
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22'
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                       WHERE d2.shed_id = d.shed_id AND d2.flock_id = d.flock_id)
ORDER BY f.name, s.shed_no;

-- [5] Shed 4's own last few Flock 19 days, to see how it was left when Flock 19
-- closed -- whether it was run down to zero or simply stopped being entered.
SELECT d.record_date, fl.flock_no,
       d.opening_female, d.closing_female, d.opening_male, d.closing_male,
       d.mortality_female, COALESCE(d.transfer_female,0) AS transfer_out_f
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE f.name = 'Agraharam Potlapally' AND s.shed_no = '4'
ORDER BY d.record_date DESC
LIMIT 6;
