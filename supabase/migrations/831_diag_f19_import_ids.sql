-- Migration 831 (READ ONLY): real flock_id for Flock 19, and shed_id for every
-- shed the Kethireddypally + Agraharam Potlapally import will touch.
SELECT 'flock19' AS chk, id::text AS flock_id FROM public.flocks WHERE flock_no::text = '19';

SELECT 'kp_shed_ids' AS chk,
       string_agg(s.shed_no || '=' || s.id::text, ',' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
 WHERE fa.name = 'Kethireddypally';

SELECT 'ap_shed_ids' AS chk,
       string_agg(s.shed_no || '=' || s.id::text, ',' ORDER BY s.shed_no::int) AS rows
  FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
 WHERE fa.name = 'Agraharam Potlapally';

SELECT 'kp_farm_id' AS chk, id::text AS farm_id FROM public.farms WHERE name = 'Kethireddypally';
SELECT 'ap_farm_id' AS chk, id::text AS farm_id FROM public.farms WHERE name = 'Agraharam Potlapally';

-- Confirm zero existing daily_records rows for Flock 19 before 23-06-2025 (must be
-- empty, otherwise we'd be double-inserting).
SELECT 'existing_pre_2306' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23';
