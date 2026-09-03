-- Migration 1135: read-only. Aggregated, because 1134's row list was cut off
-- by the log's per-line cap and a truncated sample is not evidence.
--
-- Two questions:
--   A. Flock 22 -- how many birds are at Agraharam, how many still at
--      Kethireddypally, and does the total match what was placed? That says
--      what is left to move into Shed 4.
--   B. Flock 19 -- it is marked closed, but Agraharam Shed 4's last record
--      (13/06) still carries 8,043 F / 444 M with no transfer-out and no cull.
--      Does the flock still read as holding birds?
--
-- Nothing is written.

-- [1] Flock 22 by farm, each shed counted on its own latest date.
SELECT f.name AS farm,
       count(*)::int AS sheds,
       sum(d.closing_female)::int AS closing_f,
       sum(d.closing_male)::int AS closing_m,
       max(d.record_date) AS latest
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms f ON f.id = s.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22'
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                       WHERE d2.shed_id = d.shed_id AND d2.flock_id = d.flock_id)
GROUP BY f.name ORDER BY f.name;

-- [2] Flock 22 as placed, against what the daily records now hold.
SELECT fl.flock_no,
       (fl.paid_female + COALESCE(fl.free_female,0))::int AS placed_f,
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

-- [3] Every Kethireddypally shed still holding Flock 22 birds on its own last
-- date -- exactly what is still to be moved to Agraharam.
SELECT COALESCE(string_agg(t.shed_no || ':' || t.cf || 'F/' || t.cm || 'M',
                           ' | ' ORDER BY t.shed_no), 'NONE LEFT') AS kpally_holding
FROM (
  SELECT s.shed_no, d.closing_female AS cf, d.closing_male AS cm
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms f ON f.id = s.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no = '22' AND f.name = 'Kethireddypally'
    AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                         WHERE d2.shed_id = d.shed_id AND d2.flock_id = d.flock_id)
    AND (COALESCE(d.closing_female,0) > 0 OR COALESCE(d.closing_male,0) > 0)
) t;

-- [4] Flock 19: does it still read as holding birds anywhere, despite being
-- marked closed?
SELECT COALESCE(string_agg(t.farm || ' shed ' || t.shed_no || ' ' || t.dt || ': '
                           || t.cf || 'F/' || t.cm || 'M', ' | ' ORDER BY t.shed_no),
                'ZERO EVERYWHERE') AS f19_uncleared
FROM (
  SELECT f.name AS farm, s.shed_no, d.record_date::text AS dt,
         d.closing_female AS cf, d.closing_male AS cm
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms f ON f.id = s.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no = '19'
    AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                         WHERE d2.shed_id = d.shed_id AND d2.flock_id = d.flock_id)
    AND (COALESCE(d.closing_female,0) > 0 OR COALESCE(d.closing_male,0) > 0)
) t;

-- [5] Which Agraharam sheds Flock 22 has NOT reached yet.
SELECT COALESCE(string_agg(s.shed_no, ', ' ORDER BY s.shed_no), 'ALL RECEIVED') AS agraharam_not_yet
FROM public.sheds s
JOIN public.farms f ON f.id = s.farm_id
WHERE f.name = 'Agraharam Potlapally'
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_records d
    JOIN public.flocks fl ON fl.id = d.flock_id
    WHERE d.shed_id = s.id AND fl.flock_no = '22');
