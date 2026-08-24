-- Migration 829 (READ ONLY): how did the app actually record the very first day
-- each Agraharam Potlapally shed received birds (11-17 Jun 2025) -- which column
-- carries the incoming count: received_female/male or trcull_female/male?
-- Need this before building any INSERT for the Kethireddypally import so the
-- new rows use the exact same convention as what's already live.
SELECT 'f19_ap_first_days' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || s.shed_no
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' recv_f=' || COALESCE(d.received_female,0)
            || ' trcull_f=' || COALESCE(d.trcull_female,0)
            || ' mort_f=' || COALESCE(d.mortality_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' recv_m=' || COALESCE(d.received_male,0)
            || ' trcull_m=' || COALESCE(d.trcull_male,0)
            || ' farm_id_set=' || (d.farm_id IS NOT NULL)::text) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fa ON fa.id = s.farm_id
     WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
       AND d.record_date BETWEEN '2025-06-11' AND '2025-06-13'
     ORDER BY d.record_date, s.shed_no
  ) x;

-- Also: does daily_records even have a shed_id column (used above)? Confirm real schema.
SELECT 'daily_records_cols' AS chk,
       string_agg(column_name, ',' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='daily_records';

-- And: do Kethireddypally sheds B1-B5, G1-G7 already exist as rows in public.sheds?
SELECT 'kp_sheds_exist' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fa.name || ' shed ' || s.shed_no) AS t
      FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
     WHERE fa.name ILIKE 'Kethireddypally%'
     ORDER BY s.shed_no
  ) x;
