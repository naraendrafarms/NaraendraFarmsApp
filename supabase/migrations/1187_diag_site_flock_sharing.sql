-- Migration 1187: read-only. Is a site's expenditure simply its flock's?
--
-- THE OWNER'S MODEL, which decides how expenses reach flocks: a site normally
-- holds ONE flock, so that site's spending IS that flock's cost with no maths
-- needed. Only where two flocks genuinely share a site (he names
-- Kethireddypally) does a split become necessary.
--
-- That is a much better rule than apportioning everything by bird-days, IF the
-- premise holds. So this measures it rather than taking it on trust: how many
-- distinct flocks actually had birds at each site, month by month.
--
-- "Where the birds actually were" is taken from daily_records via the shed,
-- never from flocks.laying_farm_id -- that single column is exactly what makes
-- the Daily Farm Summary show Flock 22 at one site when it is at two.
--
-- Nothing is written.

-- [1] Per site: how many distinct flocks ever, and the WORST month (the most
-- flocks sharing it at once). A site whose worst month is 1 never needs a split.
SELECT string_agg(t.txt, ' | ' ORDER BY t.mx DESC, t.nm) AS sharing_by_site
FROM (
  SELECT f.name AS nm, max(t2.n) AS mx,
         f.name || ': ' || count(DISTINCT t2.mon) || ' months, worst month ' || max(t2.n) || ' flock(s)' AS txt
  FROM (
    SELECT sh.farm_id, to_char(d.record_date,'YYYY-MM') AS mon,
           count(DISTINCT d.flock_id) AS n
    FROM public.daily_records d
    JOIN public.sheds sh ON sh.id = d.shed_id
    GROUP BY sh.farm_id, to_char(d.record_date,'YYYY-MM')
  ) t2
  JOIN public.farms f ON f.id = t2.farm_id
  GROUP BY f.name
) t;

-- [2] The months where a site really did hold more than one flock -- the only
-- cases needing an apportionment at all.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.mon DESC, t.nm), 'NO SITE EVER HELD TWO FLOCKS') AS shared_months
FROM (
  SELECT f.name AS nm, t2.mon,
         f.name || ' ' || t2.mon || ': ' || t2.n || ' flocks (' || t2.flks || ')' AS txt
  FROM (
    SELECT sh.farm_id, to_char(d.record_date,'YYYY-MM') AS mon,
           count(DISTINCT d.flock_id) AS n,
           string_agg(DISTINCT fl.flock_no, ',') AS flks
    FROM public.daily_records d
    JOIN public.sheds sh ON sh.id = d.shed_id
    JOIN public.flocks fl ON fl.id = d.flock_id
    GROUP BY sh.farm_id, to_char(d.record_date,'YYYY-MM')
    HAVING count(DISTINCT d.flock_id) > 1
  ) t2
  JOIN public.farms f ON f.id = t2.farm_id
) t;

-- [3] The mirror question: how many FLOCKS span more than one site -- the
-- Flock 22 case that the Daily Farm Summary gets wrong today.
SELECT string_agg(t.txt, ' | ' ORDER BY t.fno) AS flocks_spanning_sites
FROM (
  SELECT fl.flock_no AS fno,
         'Flock ' || fl.flock_no || ': ' || count(DISTINCT sh.farm_id) || ' sites ('
           || string_agg(DISTINCT f.code, ',') || ')' AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  GROUP BY fl.flock_no
  HAVING count(DISTINCT sh.farm_id) > 1
) t;

-- [4] What the flocks table CLAIMS versus where the birds are, so the size of
-- the mismatch the summary screen inherits is a number rather than an anecdote.
SELECT count(*)::int AS flocks_with_daily_records,
       count(*) FILTER (WHERE n_sites > 1)::int AS span_more_than_one_site,
       count(*) FILTER (WHERE n_sites = 1)::int AS single_site
FROM (
  SELECT d.flock_id, count(DISTINCT sh.farm_id) AS n_sites
  FROM public.daily_records d JOIN public.sheds sh ON sh.id = d.shed_id
  GROUP BY d.flock_id
) t;

-- [5] Flock 22 specifically, by site and month, so the split the summary must
-- show can be checked against real figures.
SELECT string_agg(t.txt, ' | ' ORDER BY t.mon, t.nm) AS flock22_by_site_month
FROM (
  SELECT f.name AS nm, to_char(d.record_date,'YYYY-MM') AS mon,
         f.code || ' ' || to_char(d.record_date,'YYYY-MM') || ': '
           || count(DISTINCT d.shed_id) || ' sheds, ' || sum(COALESCE(d.total_eggs,0)) || ' eggs' AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  WHERE fl.flock_no = '22'
  GROUP BY f.name, f.code, to_char(d.record_date,'YYYY-MM')
) t;
