-- Migration 1117: read-only. Map the four line sheets to real farms.
--
-- Image 1 is Kethireddypally (owner-confirmed: brooding 5,6,10,11,12 and
-- growing 1,2,3,4,7,8,9). Images 2, 3 and 4 say only "Shed 1..N" with no site
-- name, and shed numbers repeat across farms, so the shed master has to say
-- which farm each can belong to before anything is loaded.

-- Farm by farm: how many sheds and which numbers.
SELECT string_agg(x.line, ' || ' ORDER BY x.line) AS farm_sheds
FROM (
  SELECT fm.name || ' (' || count(*)::text || '): '
         || string_agg(s.shed_no, ',' ORDER BY (regexp_replace(s.shed_no,'\D','','g'))::int) AS line
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
  GROUP BY fm.name
) x;

-- Which sheds already carry an A/B box split, and which only a total.
SELECT string_agg(y.line, ' || ' ORDER BY y.line) AS box_coverage
FROM (
  SELECT fm.name || ': A/B=' || count(*) FILTER (WHERE s.a_side_boxes IS NOT NULL)::text
         || ' totalonly=' || count(*) FILTER (WHERE s.a_side_boxes IS NULL AND s.total_boxes IS NOT NULL)::text
         || ' none=' || count(*) FILTER (WHERE s.a_side_boxes IS NULL AND s.total_boxes IS NULL)::text AS line
  FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
  GROUP BY fm.name
) y;

-- Kethireddypally's stored totals, to check against image 1 (expects 24,044).
SELECT COALESCE(sum(s.total_boxes),0)::int AS kpally_total_boxes,
       count(*)::int                        AS kpally_sheds
FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally';

-- Per-shed stored boxes at Kethireddypally, to compare line by line.
SELECT string_agg(s.shed_no || '=' || COALESCE(s.total_boxes::text,'null')
       || '(a' || COALESCE(s.a_side_boxes::text,'-') || '/b' || COALESCE(s.b_side_boxes::text,'-') || ')',
       ' | ' ORDER BY (regexp_replace(s.shed_no,'\D','','g'))::int) AS kpally_detail
FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally';

-- Which farms currently hold live birds, so "capacity vs occupancy" can be
-- judged against the real flock placement rather than guessed.
SELECT string_agg(z.line, ' | ' ORDER BY z.line) AS live_birds_by_farm
FROM (
  SELECT fm.name || '=' || COALESCE(sum(d.closing_female),0)::text AS line
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE d.record_date = (SELECT max(record_date) FROM public.daily_records)
  GROUP BY fm.name
) z;
