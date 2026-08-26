-- Confirm Kethireddypally shed types from master, and pin Excel G1-G7 to app
-- shed numbers by value-matching Flock 20's grower period. Read-only.

SELECT string_agg(s.shed_no || ':' || COALESCE(s.shed_type,'?') , ' | ' ORDER BY (s.shed_no)::int) AS kpally_shed_types
FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
WHERE fm.name = 'Kethireddypally';

-- Flock 20 in each Kethireddypally shed: window + closing on its last day
SELECT string_agg(t.shed_no || ': ' || t.first_date || '>' || t.last_date
       || ' close=' || t.cf::text || '/' || t.cm::text, ' | ' ORDER BY (t.shed_no)::int) AS f20_per_kpally_shed
FROM (
  SELECT DISTINCT ON (d.shed_id) s.shed_no,
    min(d.record_date) OVER (PARTITION BY d.shed_id)::text AS first_date,
    d.record_date::text AS last_date,
    COALESCE(d.closing_female,0) AS cf, COALESCE(d.closing_male,0) AS cm
  FROM public.daily_records d
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  ORDER BY d.shed_id, d.record_date DESC
) t;

-- Transfer-out fingerprints: Flock 20 grower sheds, 24-28 Sep 2025
SELECT string_agg(s.shed_no || '@' || d.record_date::text || '=' || COALESCE(d.transfer_female,0)::text,
       ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS sep_transfer_out
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND COALESCE(d.transfer_female,0) <> 0;

-- Same window using closing drop instead, in case transfer_female was never filled
SELECT string_agg(s.shed_no || '@' || d.record_date::text || ' open=' || COALESCE(d.opening_female,0)::text
       || ' close=' || COALESCE(d.closing_female,0)::text, ' | ' ORDER BY d.record_date, (s.shed_no)::int) AS sep_open_close
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0' AND fm.name = 'Kethireddypally'
  AND d.record_date BETWEEN '2025-09-24' AND '2025-09-28'
  AND COALESCE(d.opening_female,0) <> COALESCE(d.closing_female,0);
