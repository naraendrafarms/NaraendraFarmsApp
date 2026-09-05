-- Migration 1188: read-only. Did Flock 22 really have birds at Agraharam
-- Potlapally in June 2026, or is that one row an artefact?
--
-- 1187 reported Agraharam as SHARED in 2026-06 between Flocks 19 and 22, which
-- the owner says is wrong -- Flock 22 was at Kethireddypally then. The Flock 22
-- side of that month was a single shed, which is exactly what a stray record
-- looks like. Migration 1123 already fixed a "stray" on this flock once.
--
-- If it is one row carrying no birds and no eggs, Agraharam never really shared
-- and the owner is right.
--
-- Nothing is written.

-- [1] Every Flock 22 record at Agraharam, whatever the month.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.d), 'NONE') AS f22_at_agraharam
FROM (
  SELECT d.record_date AS d,
         d.record_date::text || ' shed ' || COALESCE(sh.shed_no,'?')
           || ': open ' || COALESCE(d.opening_female,0) || 'F+' || COALESCE(d.opening_male,0) || 'M'
           || ', close ' || COALESCE(d.closing_female,0) || 'F+' || COALESCE(d.closing_male,0) || 'M'
           || ', eggs ' || COALESCE(d.total_eggs,0)
           || ', feed ' || round(COALESCE(d.feed_female_kg,0) + COALESCE(d.feed_male_kg,0)) AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no = '22' AND f.code = 'PPALLY'
) t;

-- [2] How many of those rows are completely empty -- no birds, no eggs, no feed.
-- An empty row is a placeholder, not birds at a site.
SELECT count(*)::int AS f22_ppally_rows,
       count(*) FILTER (WHERE COALESCE(d.opening_female,0) = 0 AND COALESCE(d.opening_male,0) = 0
                          AND COALESCE(d.closing_female,0) = 0 AND COALESCE(d.closing_male,0) = 0
                          AND COALESCE(d.total_eggs,0) = 0)::int AS completely_empty,
       count(*) FILTER (WHERE COALESCE(d.opening_female,0) + COALESCE(d.opening_male,0) > 0)::int AS rows_with_birds,
       min(d.record_date)::text || ' to ' || max(d.record_date)::text AS span
FROM public.daily_records d
JOIN public.sheds sh ON sh.id = d.shed_id
JOIN public.farms f ON f.id = sh.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22' AND f.code = 'PPALLY';

-- [3] The same test for every flock/site pair 1187 called "sharing", so the
-- claim is rebuilt counting ONLY rows that actually carry birds.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.mon DESC, t.nm), 'NO SITE EVER HELD TWO FLOCKS WITH BIRDS') AS real_shared_months
FROM (
  SELECT f.name AS nm, to_char(d.record_date,'YYYY-MM') AS mon,
         f.code || ' ' || to_char(d.record_date,'YYYY-MM') || ': '
           || count(DISTINCT d.flock_id) || ' flocks (' || string_agg(DISTINCT fl.flock_no, ',') || ')' AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE COALESCE(d.opening_female,0) + COALESCE(d.opening_male,0) > 0
  GROUP BY f.name, f.code, to_char(d.record_date,'YYYY-MM')
  HAVING count(DISTINCT d.flock_id) > 1
) t;

-- [4] And which flocks genuinely span sites, counting only rows with birds.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.fno), 'NONE') AS real_flocks_spanning_sites
FROM (
  SELECT fl.flock_no AS fno,
         'Flock ' || fl.flock_no || ': ' || string_agg(DISTINCT f.code, ',') AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE COALESCE(d.opening_female,0) + COALESCE(d.opening_male,0) > 0
  GROUP BY fl.flock_no
  HAVING count(DISTINCT sh.farm_id) > 1
) t;
