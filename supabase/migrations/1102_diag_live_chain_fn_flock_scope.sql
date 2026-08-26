-- Does the LIVE cascade function scope to flock_id, or only shed_id? Read-only.
SELECT p.proname,
       (pg_get_functiondef(p.oid) LIKE '%flock_id = NEW.flock_id%') AS scopes_by_flock,
       (pg_get_functiondef(p.oid) LIKE '%shed_id = NEW.shed_id%')   AS scopes_by_shed
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('fn_chain_cascade','fn_chain_daily_opening');

-- Which flocks hold rows in the grower sheds I would edit, and when
SELECT string_agg(x.shed_no || ':F' || x.flock_no || ' ' || x.mind || '>' || x.maxd, ' | '
       ORDER BY (x.shed_no)::int, x.flock_no) AS occupancy
FROM (
  SELECT s.shed_no, f.flock_no,
         min(d.record_date)::text AS mind, max(d.record_date)::text AS maxd
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
  JOIN public.farms fm ON fm.id = s.farm_id
  WHERE fm.name = 'Kethireddypally' AND s.shed_no IN ('1','3','4','7','8','9')
  GROUP BY s.shed_no, f.flock_no
) x;

-- Flock 20 rows that exist AFTER 28/09/2025 in those same sheds (cascade would reach these)
SELECT count(*)::int AS f20_rows_after_2025_09_28_in_those_sheds
FROM public.daily_records d
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND fm.name = 'Kethireddypally' AND s.shed_no IN ('1','3','4','7','8','9')
  AND d.record_date > '2025-09-28';
